import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * NOT CURRENTLY WIRED TO THE CHECKOUT UI.
 * The live purchase flow is WhatsApp (see src/lib/whatsapp.ts and the
 * "Acheter maintenant" buttons) — orders are confirmed manually by an
 * admin. This module is kept in place, ready to switch on, for whenever
 * online payment is enabled.
 */

/**
 * Provider-agnostic payment interface. Add a new provider by implementing
 * this interface (e.g. mobile-money-provider.ts) and registering it below —
 * nothing else in the codebase needs to change.
 */
export interface PaymentProvider {
  name: string;
  createPaymentIntent(orderId: string, amount: number, currency: string): Promise<{ providerRef: string; clientSecret?: string; redirectUrl?: string }>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhookEvent(rawBody: string): { providerRef: string; status: "PAID" | "FAILED" | "PROCESSING" };
}

const stripe = new Stripe(process.env.PAYMENT_SECRET_KEY ?? "", { apiVersion: "2024-06-20" });

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createPaymentIntent(orderId, amount, currency) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses the smallest currency unit
      currency,
      metadata: { orderId },
    });
    return { providerRef: intent.id, clientSecret: intent.client_secret ?? undefined };
  },

  verifyWebhookSignature(rawBody, signature) {
    try {
      stripe.webhooks.constructEvent(rawBody, signature, process.env.PAYMENT_WEBHOOK_SECRET ?? "");
      return true;
    } catch {
      return false;
    }
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody) as Stripe.Event;
    const obj = event.data.object as Stripe.PaymentIntent;
    const statusMap: Record<string, "PAID" | "FAILED" | "PROCESSING"> = {
      succeeded: "PAID",
      payment_failed: "FAILED",
      processing: "PROCESSING",
    };
    return { providerRef: obj.id, status: statusMap[event.type.split(".").pop() ?? ""] ?? "PROCESSING" };
  },
};

// Register additional providers here, e.g.:
// export const mobileMoneyProvider: PaymentProvider = { ... };

export const paymentProviders: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
};

/** Creates the Payment record + provider intent for an order. */
export async function initiatePayment(orderId: string, providerName: keyof typeof paymentProviders) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const provider = paymentProviders[providerName];

  const intent = await provider.createPaymentIntent(order.id, Number(order.total), "xof");

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: provider.name,
      providerRef: intent.providerRef,
      status: "PENDING",
      amount: order.total,
      currency: "XOF",
    },
  });

  return { payment, clientSecret: intent.clientSecret, redirectUrl: intent.redirectUrl };
}
