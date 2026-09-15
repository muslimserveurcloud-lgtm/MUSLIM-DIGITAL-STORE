import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createOrderFromCart } from "@/lib/services/order-service";
import { initiateFapshiPayment } from "@/lib/services/fapshi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Connectez-vous pour continuer" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { customerName, customerEmail, items } = body ?? {};

  if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    // Price is ALWAYS recomputed here from the database — see order-service.ts.
    // Nothing sent by the client about price is ever trusted.
    const order = await createOrderFromCart((session.user as any).id, items, {
      name: customerName,
      email: customerEmail,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const payment = await initiateFapshiPayment({
      amount: Number(order.total),
      email: customerEmail,
      redirectUrl: `${appUrl}/order-confirmation?orderId=${order.id}`,
      externalId: order.id,
      message: `Commande ${order.id.slice(0, 8)} — MUSLIM DIGITAL STORE`,
    });

    return NextResponse.json({ paymentLink: payment.link, orderId: order.id });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de la préparation du paiement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
