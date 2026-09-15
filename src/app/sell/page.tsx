import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { SellForm } from "./SellForm";

export const dynamic = "force-dynamic";

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  PENDING: {
    title: "Candidature en cours d'examen",
    body: "Votre demande pour devenir vendeur a bien été reçue. Nous vous répondrons rapidement.",
  },
  APPROVED: {
    title: "Vous êtes vendeur !",
    body: "Votre candidature a été approuvée. Rendez-vous sur votre espace vendeur pour ajouter vos produits.",
  },
  REJECTED: {
    title: "Candidature non retenue",
    body: "Votre candidature n'a pas été retenue cette fois-ci. Contactez-nous si vous pensez qu'il s'agit d'une erreur.",
  },
  SUSPENDED: {
    title: "Compte vendeur suspendu",
    body: "Votre compte vendeur est actuellement suspendu. Contactez-nous pour plus d'informations.",
  },
};

export default async function SellPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/sell");

  const seller = await prisma.seller.findUnique({ where: { userId: (session.user as any).id } });

  if (seller) {
    const info = STATUS_MESSAGES[seller.status];
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <h1 className="text-xl font-semibold text-white">{info.title}</h1>
        <p className="text-neutral-400 text-sm">{info.body}</p>
        {seller.status === "APPROVED" && (
          <a href="/seller" className="rounded-xl bg-emerald-500 text-black font-semibold px-6 py-3 mt-2">
            Aller à mon espace vendeur
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Devenir vendeur</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Vendez vos propres produits numériques sur MUSLIM DIGITAL STORE. Votre candidature sera examinée par notre
        équipe avant activation.
      </p>
      <SellForm />
    </div>
  );
}
