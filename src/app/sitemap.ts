export const dynamic = "force-dynamic";

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://muslimdigitalstore.com";

  const products = await prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  const categories = await prisma.category.findMany({ select: { slug: true } });

  const staticRoutes = ["", "/shop", "/faq", "/contact", "/about", "/legal/terms", "/legal/privacy", "/legal/refunds"].map(
    (path) => ({ url: `${base}${path}`, lastModified: new Date() })
  );

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
