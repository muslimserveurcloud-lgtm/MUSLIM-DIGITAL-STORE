import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
      <p className="text-6xl font-extrabold text-emerald-500">404</p>
      <h1 className="text-xl font-semibold text-white">Page introuvable</h1>
      <p className="text-neutral-400 text-sm">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 mt-2">
        Retour à l'accueil
      </Link>
    </div>
  );
}
