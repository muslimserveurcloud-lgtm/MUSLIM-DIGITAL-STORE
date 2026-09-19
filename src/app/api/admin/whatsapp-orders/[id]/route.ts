import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWhatsappOrderStatusEmail } from "@/lib/email";
import { deliverWhatsappOrderViaTelegram } from "@/lib/telegram-delivery";

const statusSchema = z.object({
  status: z.enum(["NEW_REQUEST", "PAYMENT_PENDING", "PAID", "DELIVERED", "COMPLETED", "CANCELLED"]),
});

// Statuses that trigger a customer notification email, if an email was
// given during the WhatsApp exchange. Requires a real EMAIL_API_KEY to
// actually deliver — see README.
const NOTIFY_STATUSES = new Set(["PAID", "DELIVERED", "COMPLETED"]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = statusSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = await prisma.whatsappOrder.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    include: { items: true },
  });

  if (order.customerEmail && NOTIFY_STATUSES.has(order.status)) {
    // Don't fail the status update if the email provider isn't configured
    // yet — log and move on.
    try {
      await sendWhatsappOrderStatusEmail({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: order.items.map((i) => ({ productName: i.productName })),
        total: order.total,
        status: order.status,
      });
    } catch (err) {
      console.error("Failed to send WhatsApp order status email:", err);
    }
  }

  if (order.status === "PAID") {
    try {
      await deliverWhatsappOrderViaTelegram(order.id);
    } catch (err) {
      console.error("Failed to auto-deliver via Telegram:", err);
    }
  }

  return NextResponse.json(order);
}
