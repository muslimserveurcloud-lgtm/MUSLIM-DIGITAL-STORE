import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — stored directly in the database
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB for the product image

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user && (session.user as any).role === "ADMIN" ? session : null;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const productId = form.get("productId") as string | null;
  const image = form.get("image") as File | null;
  const file = form.get("file") as File | null;

  if (!productId) return NextResponse.json({ error: "productId manquant" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

  if (image) {
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image trop lourde (max 3 Mo)" }, { status: 400 });
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    const dataUri = `data:${image.type};base64,${buffer.toString("base64")}`;
    await prisma.product.update({ where: { id: productId }, data: { imageUrl: dataUri } });
  }

  if (file) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    await prisma.productFile.create({
      data: {
        productId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        fileData: buffer,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
