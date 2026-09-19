"use client";

import { MessageCircle } from "lucide-react";
import { buildCartWhatsappLink, WhatsappProductLine } from "@/lib/whatsapp";

export function WhatsappCartCheckoutButton({ items }: { items: WhatsappProductLine[] }) {
  const href = buildCartWhatsappLink(items);
  const disabled = items.length === 0;

  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      className={`flex items-center justify-center gap-2 w-full rounded-xl font-semibold py-3 px-4 transition-colors ${
        disabled
          ? "bg-neutral-800 text-neutral-500 cursor-not-allowed pointer-events-none"
          : "bg-[#25D366] hover:bg-[#1ebe5a] text-black"
      }`}
    >
      <MessageCircle size={20} />
      Acheter via WhatsApp
    </a>
  );
}
