export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";

type SearchParams = { q?: string; category?: string; sort?: string };

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const categories = await prisma.category.findMany();

  const orderBy =
    searchParams.sort === "price_asc"
      ? { price: "asc" as const }
      : searchParams.sort === "price_desc"
      ? { price: "desc" as const }
      : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(searchParams.q && {
        OR: [
          { name: { contains: searchParams.q, mode: "insensitive" } },
          { shortDescription: { contains: searchParams.q, mode: "insensitive" } },
        ],
      }),
      ...(searchParams.category && { category: { slug: searchParams.category } }),
    },
    include: { category: true, seller: true },
    orderBy,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Boutique</h1>

      <form className="flex flex-wrap gap-3 mb-8" action="/shop">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Rechercher un produit..."
          className="flex-1 min-w-[200px] rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white placeholder:text-neutral-600"
        />
        <select
          name="category"
          defaultValue={searchParams.category}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={searchParams.sort}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        >
          <option value="new">Nouveautés</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
        <button className="rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2">Filtrer</button>
      </form>

      {products.length === 0 ? (
        <p className="text-neutral-500">Aucun produit ne correspond à votre recherche.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                shortDescription: p.shortDescription,
                price: Number(p.price),
                salePrice: p.salePrice ? Number(p.salePrice) : null,
                imageUrl: p.imageUrl,
                category: p.category.name,
                sellerWhatsappNumber: p.seller?.whatsappNumber,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
