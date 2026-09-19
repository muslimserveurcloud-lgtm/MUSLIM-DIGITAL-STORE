export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";
import { NewsletterForm } from "@/components/shop/NewsletterForm";
import { storeConfig } from "@/lib/config";

export default async function HomePage() {
  const [popular, latest] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED", isPopular: true }, include: { category: true, seller: true }, take: 4 }),
    prisma.product.findMany({ where: { status: "PUBLISHED" }, include: { category: true, seller: true }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Bienvenue sur {storeConfig.name}
        </h1>
        <p className="text-neutral-400 max-w-xl">
          Découvrez des produits numériques conçus pour vous aider à créer, apprendre et développer vos projets.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/shop" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3">
            Découvrir la boutique
          </Link>
          <Link href="/shop?sort=new" className="rounded-xl border border-neutral-700 hover:border-neutral-500 text-white px-6 py-3">
            Voir les nouveautés
          </Link>
        </div>
      </section>

      {popular.length > 0 && (
        <Section title="Produits populaires">
          {popular.map((p) => (
            <ProductCard key={p.id} product={toCard(p)} />
          ))}
        </Section>
      )}

      {latest.length > 0 && (
        <Section title="Nouveautés">
          {latest.map((p) => (
            <ProductCard key={p.id} product={toCard(p)} />
          ))}
        </Section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-xl font-semibold text-white mb-6">Pourquoi nous choisir</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-sm text-neutral-400">
          <div className="rounded-xl border border-neutral-800 p-5">Livraison immédiate après validation de la commande</div>
          <div className="rounded-xl border border-neutral-800 p-5">Un contact humain sur WhatsApp pour chaque achat</div>
          <div className="rounded-xl border border-neutral-800 p-5">Des produits numériques pensés pour vos projets</div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-neutral-900">
        <h2 className="text-xl font-semibold text-white mb-3">Newsletter</h2>
        <p className="text-neutral-400 text-sm mb-4">Recevez nos nouveautés et offres directement par email.</p>
        <NewsletterForm />
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function toCard(p: any) {
  return {
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    imageUrl: p.imageUrl,
    category: p.category.name,
    sellerWhatsappNumber: p.seller?.whatsappNumber,
  };
}
