"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SellForm() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: "", whatsappNumber: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/seller/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erreur lors de l'envoi de la candidature.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        required
        placeholder="Nom de votre activité"
        value={form.businessName}
        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
        className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
      />
      <input
        required
        placeholder="Numéro WhatsApp (ex: 237697929580)"
        value={form.whatsappNumber}
        onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
        className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
      />
      <textarea
        placeholder="Décrivez ce que vous vendez (optionnel)"
        rows={3}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button disabled={loading} className="rounded-lg bg-emerald-500 text-black font-semibold py-3 disabled:opacity-50">
        {loading ? "Envoi..." : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
