"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "Mot de passe mis à jour." });
      setCurrent("");
      setNext("");
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Une erreur est survenue." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-3 max-w-sm">
      <input
        type="password"
        required
        placeholder="Mot de passe actuel"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white"
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="Nouveau mot de passe"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white"
      />
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
      )}
      <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
        {loading ? "..." : "Mettre à jour"}
      </button>
    </form>
  );
}
