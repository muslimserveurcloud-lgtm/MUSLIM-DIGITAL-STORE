import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WhatsappBuyButton } from "@/components/shop/WhatsappBuyButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: `${product.name} — MUSLIM DIGITAL STORE`,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, images: product.imageUrl ? [product.imageUrl] : [] },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: { category: true, seller: true, reviews: { where: { isApproved: true } } },
  });

  if (!product) notFound();

  const similar = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: "PUBLISHED", NOT: { id: product.id } },
    include: { seller: true },
    take: 4,
  });

  const displayPrice = Number(product.salePrice ?? product.price);
  const onSale = product.salePrice != null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: displayPrice,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative aspect-square rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">{product.name}</div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-wide text-emerald-400">{product.category.name}</span>
        <h1 className="text-3xl font-bold text-white">{product.name}</h1>
        <p className="text-neutral-400">{product.shortDescription}</p>

        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-white">{formatPrice(displayPrice)}</span>
          {onSale && (
            <span className="text-lg text-neutral-500 line-through">{formatPrice(Number(product.price))}</span>
          )}
        </div>

        {product.seller && (
          <p className="text-sm text-neutral-500">
            Vendu par <span className="text-neutral-300 font-medium">{product.seller.businessName}</span>
          </p>
        )}

        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">
          Pour acheter ce produit, contactez {product.seller ? "le vendeur" : "notre équipe"} directement sur
          WhatsApp. Aucune carte bancaire n'est requise sur le site.
        </div>

        <WhatsappBuyButton
          productName={product.name}
          price={displayPrice}
          slug={product.slug}
          whatsappNumber={product.seller?.whatsappNumber}
        />

        <dl className="grid grid-cols-2 gap-3 text-sm text-neutral-400 border-t border-neutral-800 pt-4 mt-2">
          {product.fileFormat && (
            <>
              <dt className="text-neutral-500">Format</dt>
              <dd>{product.fileFormat}</dd>
            </>
          )}
          {product.fileSizeLabel && (
            <>
              <dt className="text-neutral-500">Taille</dt>
              <dd>{product.fileSizeLabel}</dd>
            </>
          )}
          {product.compatibility && (
            <>
              <dt className="text-neutral-500">Compatibilité</dt>
              <dd>{product.compatibility}</dd>
            </>
          )}
        </dl>

        <div className="prose prose-invert prose-sm max-w-none border-t border-neutral-800 pt-4">
          {product.description}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="md:col-span-2 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Produits similaires</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  shortDescription: p.shortDescription,
                  price: Number(p.price),
                  salePrice: p.salePrice ? Number(p.salePrice) : null,
                  imageUrl: p.imageUrl,
                  category: product.category.name,
                  sellerWhatsappNumber: p.seller?.whatsappNumber,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
