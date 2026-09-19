import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  customerName: z.string().min(1),
  whatsappNumber: z.string().min(6),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        productName: z.string().min(1),
        price: z.number().nonnegative(),
      })
    )
    .min(1),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orders = await prisma.whatsappOrder.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerName, whatsappNumber, customerEmail, notes, items } = parsed.data;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  const order = await prisma.whatsappOrder.create({
    data: {
      customerName,
      whatsappNumber,
      customerEmail: customerEmail || undefined,
      notes,
      total,
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}
