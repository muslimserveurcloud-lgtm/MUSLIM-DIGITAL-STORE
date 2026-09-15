import Image from "next/image";
import Link from "next/link";
import { WhatsappBuyButton } from "./WhatsappBuyButton";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  category: string;
  sellerWhatsappNumber?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const displayPrice = product.salePrice ?? product.price;
  const onSale = product.salePrice != null && product.salePrice < product.price;

  return (
    <div className="group rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden hover:border-neutral-700 transition-colors flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/3] block bg-neutral-800">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
            {product.name}
          </div>
        )}
        {onSale && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full">
            PROMO
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">{product.category}</span>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-white leading-snug hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-neutral-400 line-clamp-2">{product.shortDescription}</p>

        <div className="mt-auto pt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-white">{formatPrice(displayPrice)}</span>
          {onSale && <span className="text-sm text-neutral-500 line-through">{formatPrice(product.price)}</span>}
        </div>

        <WhatsappBuyButton
          productName={product.name}
          price={displayPrice}
          slug={product.slug}
          whatsappNumber={product.sellerWhatsappNumber ?? undefined}
        />
      </div>
    </div>
  );
}
