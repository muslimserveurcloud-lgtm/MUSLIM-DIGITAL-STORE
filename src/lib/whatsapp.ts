import { storeConfig } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export type WhatsappProductLine = {
  name: string;
  price: number;
  slug?: string;
};

function productUrl(slug?: string) {
  if (!slug) return "";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/product/${slug}`;
}

/**
 * Builds the wa.me link for a single-product "Acheter maintenant" click.
 * If the product belongs to a marketplace seller, pass their WhatsApp
 * number as `overrideNumber` so the customer contacts that seller
 * directly instead of the platform's default number.
 */
export function buildSingleProductWhatsappLink(product: WhatsappProductLine, overrideNumber?: string) {
  const lines = [
    `Bonjour 👋`,
    "",
    "Je souhaite acheter le produit suivant :",
    "",
    `🛍️ Produit : ${product.name}`,
    `💰 Prix : ${formatPrice(product.price)}`,
  ];
  if (product.slug) lines.push(`🔗 Produit : ${productUrl(product.slug)}`);
  lines.push("", "Merci de m'indiquer la procédure pour effectuer le paiement et recevoir mon produit.");

  return buildWhatsappUrl(lines.join("\n"), overrideNumber);
}

/** Builds the wa.me link for a full-cart "Acheter via WhatsApp" click (platform number — a cart can mix sellers). */
export function buildCartWhatsappLink(items: WhatsappProductLine[]) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  const lines = [
    `Bonjour ${storeConfig.name} 👋`,
    "",
    "Je souhaite commander les produits suivants :",
    "",
    ...items.map((item, i) => `${i + 1}. ${item.name} — ${formatPrice(item.price)}`),
    "",
    `💰 Total : ${formatPrice(total)}`,
    "",
    "Merci de m'indiquer la procédure pour effectuer le paiement et recevoir mes produits.",
  ];

  return buildWhatsappUrl(lines.join("\n"));
}

function buildWhatsappUrl(message: string, overrideNumber?: string) {
  const number = overrideNumber || storeConfig.whatsappNumber;
  // encodeURIComponent correctly handles spaces, emojis, and line breaks for wa.me
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
