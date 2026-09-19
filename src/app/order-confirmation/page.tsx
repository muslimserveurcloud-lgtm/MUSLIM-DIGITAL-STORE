import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const order = searchParams.orderId
    ? await prisma.order.findUnique({ where: { id: searchParams.orderId } })
    : null;

  const isPaid = order?.status === "PAID" || order?.status === "COMPLETED";

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
      {isPaid ? (
        <>
          <p className="text-5xl">✅</p>
          <h1 className="text-xl font-semibold text-white">Paiement confirmé !</h1>
          <p className="text-neutral-400 text-sm">
            Votre commande a été payée avec succès. Vos produits sont disponibles dans votre compte, et un email de
            confirmation vous a été envoyé.
          </p>
          <Link href="/account" className="rounded-xl bg-emerald-500 text-black font-semibold px-6 py-3 mt-2">
            Voir mes téléchargements
          </Link>
        </>
      ) : (
        <>
          <p className="text-5xl">⏳</p>
          <h1 className="text-xl font-semibold text-white">Paiement en cours de confirmation</h1>
          <p className="text-neutral-400 text-sm">
            Si vous venez de payer, la confirmation peut prendre quelques instants. Vérifiez votre compte dans
            quelques minutes.
          </p>
          <Link href="/account" className="rounded-xl border border-neutral-700 text-white px-6 py-3 mt-2">
            Aller à mon compte
          </Link>
        </>
      )}
    </div>
  );
}
