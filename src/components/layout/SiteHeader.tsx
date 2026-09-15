"use client";

import Link from "next/link";
import { ShoppingCart, Menu } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { storeConfig } from "@/lib/config";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/shop", label: "Boutique" },
  { href: "/sell", label: "Devenir vendeur" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { items } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-900 bg-black/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-white tracking-tight">
          {storeConfig.name}
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-emerald-400 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative text-neutral-300 hover:text-white">
            <ShoppingCart size={22} />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
          <button className="md:hidden text-neutral-300" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden flex flex-col border-t border-neutral-900 bg-black px-4 py-3 gap-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-neutral-300" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
