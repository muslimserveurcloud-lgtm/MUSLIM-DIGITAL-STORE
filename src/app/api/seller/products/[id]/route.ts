import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireApprovedSeller() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const seller = await prisma.seller.findUnique({ where: { userId: (session.user as any).id } });
  return seller && seller.status === "APPROVED" ? seller : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const seller = await requireApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.sellerId !== seller.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.product.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const seller = await requireApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.sellerId !== seller.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
