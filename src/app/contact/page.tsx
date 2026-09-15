"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Contact</h1>
      {sent ? (
        <p className="text-emerald-400">Merci, votre message a bien été envoyé.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Honeypot field — hidden from real users, bots fill it in */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="hidden"
            aria-hidden="true"
          />
          <input required placeholder="Nom" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
          <input required placeholder="Sujet" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
          <textarea required placeholder="Message" rows={5} value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white" />
          <button disabled={loading} className="rounded-lg bg-emerald-500 text-black font-semibold py-2 disabled:opacity-50">
            {loading ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      )}
    </div>
  );
}
