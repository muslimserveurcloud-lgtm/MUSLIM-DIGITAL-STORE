import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().min(1),
  price: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional(),
  categoryId: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  externalLink: z.string().url().optional().or(z.literal("")),
});

async function requireApprovedSeller() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const seller = await prisma.seller.findUnique({ where: { userId: (session.user as any).id } });
  return seller && seller.status === "APPROVED" ? seller : null;
}

export async function GET() {
  const seller = await requireApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const seller = await requireApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data };
  if (!data.imageUrl) delete data.imageUrl;
  if (!data.externalLink) delete data.externalLink;

  const product = await prisma.product.create({
    data: { ...data, sellerId: seller.id },
  });

  return NextResponse.json(product, { status: 201 });
}
