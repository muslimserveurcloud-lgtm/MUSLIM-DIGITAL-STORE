import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const [productCount, whatsappOrders, customerCount] = await Promise.all([
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.whatsappOrder.findMany(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const revenue = whatsappOrders
    .filter((o) => ["PAID", "DELIVERED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const pending = whatsappOrders.filter((o) => o.status === "NEW_REQUEST").length;

  const cards = [
    { label: "Chiffre d'affaires (WhatsApp)", value: formatPrice(revenue) },
    { label: "Commandes WhatsApp", value: whatsappOrders.length },
    { label: "Nouvelles demandes", value: pending },
    { label: "Produits publiés", value: productCount },
    { label: "Clients", value: customerCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
