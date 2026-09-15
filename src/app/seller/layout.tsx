import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

const NAV = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/products", label: "Mes produits" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/seller");

  const seller = await prisma.seller.findUnique({ where: { userId: (session.user as any).id } });
  if (!seller) redirect("/sell");
  if (seller.status !== "APPROVED") redirect("/sell");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
      <aside className="w-48 shrink-0 hidden md:block">
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
