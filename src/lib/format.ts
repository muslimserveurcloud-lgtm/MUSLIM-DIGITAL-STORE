/**
 * Formats a price in Franc CFA (XOF) — no decimals, space as thousand
 * separator, matching how prices are conventionally written in FCFA.
 * e.g. formatPrice(5000) -> "5 000 FCFA"
 */
export function formatPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}
