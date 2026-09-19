"use client";

import { MessageCircle } from "lucide-react";
import { buildSingleProductWhatsappLink } from "@/lib/whatsapp";

type Props = {
  productName: string;
  price: number;
  slug?: string;
  whatsappNumber?: string; // seller's own number, if this product belongs to a marketplace seller
  variant?: "compact" | "full";
};

export function WhatsappBuyButton({ productName, price, slug, whatsappNumber, variant = "full" }: Props) {
  const href = buildSingleProductWhatsappLink({ name: productName, price, slug }, whatsappNumber);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        variant === "full"
          ? "flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-black font-semibold py-3 px-4 transition-colors"
          : "flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5a] text-black text-sm font-medium py-2 px-3 transition-colors"
      }
    >
      <MessageCircle size={variant === "full" ? 20 : 16} />
      {variant === "full" ? "Acheter sur WhatsApp" : "🛒 Acheter maintenant"}
    </a>
  );
}
