"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-white mb-6">Mot de passe oublié</h1>
      {sent ? (
        <p className="text-neutral-400">
          Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
          />
          <button className="rounded-lg bg-emerald-500 text-black font-semibold py-2">Envoyer le lien</button>
        </form>
      )}
    </div>
  );
}
