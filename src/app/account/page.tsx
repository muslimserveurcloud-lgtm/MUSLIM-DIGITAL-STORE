import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  NEW_REQUEST: "Nouvelle demande",
  PAYMENT_PENDING: "Paiement en attente",
  PAID: "Payé",
  DELIVERED: "Produit envoyé",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  // Best-effort match: WhatsApp orders aren't tied to an account (the
  // purchase happens outside the platform), but we can show orders placed
  // with this user's email if one was given during the WhatsApp exchange.
  const whatsappOrders = await prisma.whatsappOrder.findMany({
    where: { customerEmail: user.email },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Mon profil</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 text-sm text-neutral-300 flex flex-col gap-1">
          <p><span className="text-neutral-500">Nom : </span>{user.profile?.firstName} {user.profile?.lastName}</p>
          <p><span className="text-neutral-500">Email : </span>{user.email}</p>
          <p><span className="text-neutral-500">Téléphone : </span>{user.profile?.phone ?? "—"}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Mes commandes</h2>
        {whatsappOrders.length === 0 ? (
          <p className="text-neutral-500 text-sm">Aucune commande associée à cet email pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {whatsappOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm">
                <div className="flex justify-between text-neutral-400 mb-2">
                  <span>#{order.id.slice(0, 8)}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-white">{order.items.map((i) => i.productName).join(", ")}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-emerald-400">{STATUS_LABELS[order.status]}</span>
                  <span className="text-white font-semibold">{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Sécurité</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
