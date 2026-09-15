import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFapshiPaymentStatus } from "@/lib/services/fapshi";
import { markOrderPaid } from "@/lib/services/order-service";
import { grantDownloadsForOrder } from "@/lib/services/download-service";
import { sendOrderPaidEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * SECURITY-CRITICAL ROUTE.
 *
 * Fapshi's webhook payload has no cryptographic signature, so it is never
 * trusted directly. It only tells us which transaction to re-check; the
 * actual confirmation always comes from an authenticated call back to
 * Fapshi's own status endpoint (see src/lib/services/fapshi.ts).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transId = body?.transId;
  if (!transId) return NextResponse.json({ error: "Missing transId" }, { status: 400 });

  let verified;
  try {
    verified = await getFapshiPaymentStatus(transId);
  } catch (err) {
    console.error("Failed to verify Fapshi payment status:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  const orderId = verified.externalId;
  if (!orderId) return NextResponse.json({ ok: true });

  const existingPayment = await prisma.payment.findFirst({ where: { providerRef: transId } });

  if (verified.status === "SUCCESSFUL") {
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          orderId,
          provider: "fapshi",
          providerRef: transId,
          status: "PAID",
          amount: verified.amount,
          currency: "XOF",
        },
      });
      const order = await markOrderPaid(orderId);
      const downloads = await grantDownloadsForOrder(order.id);
      await sendOrderPaidEmail(order, downloads);
    }
  } else {
    const status = verified.status === "EXPIRED" ? "CANCELLED" : "FAILED";
    if (existingPayment) {
      await prisma.payment.update({ where: { id: existingPayment.id }, data: { status } });
    } else {
      await prisma.payment.create({
        data: { orderId, provider: "fapshi", providerRef: transId, status, amount: verified.amount, currency: "XOF" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
