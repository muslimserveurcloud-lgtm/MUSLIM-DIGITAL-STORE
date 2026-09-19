import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `${storeConfig.name} — ${storeConfig.tagline}`,
  description:
    "Découvrez des produits numériques conçus pour vous aider à créer, apprendre et développer vos projets.",
  openGraph: {
    title: storeConfig.name,
    description: storeConfig.tagline,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-black text-neutral-100 antialiased min-h-screen flex flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
