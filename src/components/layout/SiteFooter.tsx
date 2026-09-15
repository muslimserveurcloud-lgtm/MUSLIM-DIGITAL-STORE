import Link from "next/link";
import { storeConfig } from "@/lib/config";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/shop", label: "Boutique" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal/terms", label: "Conditions générales" },
  { href: "/legal/privacy", label: "Politique de confidentialité" },
  { href: "/legal/refunds", label: "Politique de remboursement" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-900 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="font-bold text-white">{storeConfig.name}</p>
          <p className="text-sm text-neutral-500">{storeConfig.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-neutral-400">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-emerald-400 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="text-center text-xs text-neutral-600 pb-6">
        © {new Date().getFullYear()} {storeConfig.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
