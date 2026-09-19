import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function SellerDashboard() {
  const session = await getServerSession(authOptions);
  const seller = await prisma.seller.findUnique({
    where: { userId: (session!.user as any).id },
  });

  const [productCount, orders] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller!.id, status: "PUBLISHED" } }),
    prisma.whatsappOrder.findMany({ where: { sellerId: seller!.id } }),
  ]);

  const revenue = orders
    .filter((o) => ["PAID", "DELIVERED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const cards = [
    { label: "Chiffre d'affaires", value: formatPrice(revenue) },
    { label: "Commandes", value: orders.length },
    { label: "Produits publiés", value: productCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bonjour, {seller!.businessName}</h1>
        <p className="text-neutral-500 text-sm">Votre espace vendeur MUSLIM DIGITAL STORE</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
