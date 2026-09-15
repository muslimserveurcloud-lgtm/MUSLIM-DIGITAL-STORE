"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/account");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-white mb-6">Connexion</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-emerald-500 text-black font-semibold py-2 disabled:opacity-50">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="flex justify-between text-sm text-neutral-500 mt-4">
        <Link href="/forgot-password" className="hover:text-emerald-400">Mot de passe oublié ?</Link>
        <Link href="/register" className="hover:text-emerald-400">Créer un compte</Link>
      </div>
    </div>
  );
}
