"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Impossible de créer le compte.");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-white mb-6">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <input placeholder="Prénom" value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
          <input placeholder="Nom" value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
        </div>
        <input type="email" required placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
        <input type="password" required minLength={8} placeholder="Mot de passe (8 caractères min.)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-emerald-500 text-black font-semibold py-2 disabled:opacity-50">
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-4">
        Déjà un compte ? <Link href="/login" className="text-emerald-400">Se connecter</Link>
      </p>
    </div>
  );
}
