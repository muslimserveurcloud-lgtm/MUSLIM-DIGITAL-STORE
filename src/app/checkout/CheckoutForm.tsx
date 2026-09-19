"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export function CheckoutForm({ defaultEmail }: { defaultEmail: string }) {
  const { items, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, i) => sum + i.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Votre panier est vide.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          items: items.map((i) => ({ productId: i.productId, quantity: 1 })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la préparation du paiement.");
        setLoading(false);
        return;
      }

      clear();
      window.location.href = data.paymentLink;
    } catch {
      setError("Erreur réseau, réessaie.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-neutral-400">Votre panier est vide.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Paiement</h1>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 mb-6">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm text-neutral-300 py-1">
            <span>{item.name}</span>
            <span>{formatPrice(item.price)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-white border-t border-neutral-800 mt-2 pt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-neutral-500 mt-2">Ce montant est fixe et ne peut pas être modifié.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-white"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="rounded-lg bg-emerald-500 text-black font-semibold py-3 disabled:opacity-50"
        >
          {loading ? "Redirection vers le paiement..." : `Payer ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  );
}
