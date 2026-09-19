import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentProviders } from "@/lib/services/payment-service";
import { markOrderPaid } from "@/lib/services/order-service";
import { grantDownloadsForOrder } from "@/lib/services/download-service";
import { sendOrderPaidEmail } from "@/lib/email";

/**
 * SECURITY-CRITICAL ROUTE.
 *
 * An order is NEVER marked as paid by the frontend, by the checkout page,
 * or by any client-supplied "success" redirect. It is marked paid ONLY
 * here, after the payment provider's signature has been verified on the
 * raw request body.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const provider = paymentProviders.stripe; // swap/select provider by route or header if you add more

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = provider.parseWebhookEvent(rawBody);

  const payment = await prisma.payment.findFirst({
    where: { providerRef: event.providerRef },
  });
  if (!payment) {
    return NextResponse.json({ error: "Unknown payment reference" }, { status: 404 });
  }

  if (payment.status === "PAID") {
    // Already processed — webhooks can be delivered more than once.
    return NextResponse.json({ received: true });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: event.status, rawWebhookEvent: JSON.parse(rawBody) },
  });

  if (event.status === "PAID") {
    const order = await markOrderPaid(payment.orderId);
    const downloads = await grantDownloadsForOrder(order.id);
    await sendOrderPaidEmail(order, downloads);
  }

  return NextResponse.json({ received: true });
}
