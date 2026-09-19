/**
 * Centralized store configuration.
 * Change the WhatsApp number here ONLY — every buy button in the app reads
 * from this file (or from NEXT_PUBLIC_WHATSAPP_NUMBER if set in .env).
 */
export const storeConfig = {
  name: "MUSLIM DIGITAL STORE",
  tagline: "Le digital. Simple. Puissant. Accessible.",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "237697929580", // no +, no spaces (wa.me format)
  currency: "XOF",
};
