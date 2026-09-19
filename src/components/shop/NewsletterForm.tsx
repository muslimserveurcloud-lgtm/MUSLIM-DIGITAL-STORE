"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
  }

  if (done) return <p className="text-emerald-400 text-sm">Merci, vous êtes inscrit(e) !</p>;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        type="email"
        required
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
      />
      <button className="rounded-lg bg-emerald-500 text-black text-sm font-semibold px-4">S'inscrire</button>
    </form>
  );
}
