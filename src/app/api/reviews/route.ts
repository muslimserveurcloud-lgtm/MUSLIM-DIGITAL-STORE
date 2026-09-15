import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Connectez-vous pour laisser un avis" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  // New reviews are unapproved by default — an admin moderates before they
  // go live on the product page (see model Review.isApproved).
  const review = await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: (session.user as any).id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      isApproved: false,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
