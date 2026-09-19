"use client";

import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

type Props = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  isSingleLicense?: boolean;
  variant?: "compact" | "full";
};

export function PayButton({ productId, slug, name, price, imageUrl, isSingleLicense = true, variant = "full" }: Props) {
  const { addItem } = useCart();
  const router = useRouter();

  function handleClick() {
    addItem({ productId, slug, name, price, imageUrl, isSingleLicense });
    router.push("/checkout");
  }

  return (
    <button
      onClick={handleClick}
      className={
        variant === "full"
          ? "flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-4 transition-colors"
          : "flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium py-2 px-3 transition-colors"
      }
    >
      <CreditCard size={variant === "full" ? 20 : 16} />
      {variant === "full" ? `Payer ${formatPrice(price)}` : "💳 Payer maintenant"}
    </button>
  );
}
