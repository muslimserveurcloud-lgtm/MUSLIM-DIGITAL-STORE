import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  businessName: z.string().min(1),
  whatsappNumber: z.string().min(6),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Connectez-vous pour continuer" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.seller.findUnique({ where: { userId: (session.user as any).id } });
  if (existing) return NextResponse.json({ error: "Vous avez déjà une candidature en cours" }, { status: 409 });

  const seller = await prisma.seller.create({
    data: {
      userId: (session.user as any).id,
      businessName: parsed.data.businessName,
      whatsappNumber: parsed.data.whatsappNumber,
      description: parsed.data.description,
      status: "PENDING",
    },
  });

  return NextResponse.json(seller, { status: 201 });
}
