"use client";

import { useEffect, useState } from "react";

type Coupon = {
  id: string; code: string; type: "PERCENTAGE" | "FIXED"; value: string;
  expiresAt: string | null; maxUses: number | null;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE" as "PERCENTAGE" | "FIXED", value: 10, expiresAt: "", maxUses: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      if (res.ok) {
        setForm({ code: "", type: "PERCENTAGE", value: 10, expiresAt: "", maxUses: "" });
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Codes promotionnels</h1>

      <form onSubmit={createCoupon} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-3 max-w-lg">
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Code (ex: MUSLIM10)" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white">
            <option value="PERCENTAGE">Pourcentage (%)</option>
            <option value="FIXED">Montant fixe (FCFA)</option>
          </select>
          <input required type="number" placeholder="Valeur" value={form.value}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input type="date" placeholder="Expiration" value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input type="number" placeholder="Utilisations max (optionnel)" value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        </div>
        <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
          {loading ? "Création..." : "Créer le coupon"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Valeur</th>
              <th className="text-left p-3">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-neutral-900">
                <td className="p-3 text-white font-mono">{c.code}</td>
                <td className="p-3 text-neutral-400">{c.type === "PERCENTAGE" ? "Pourcentage" : "Montant fixe"}</td>
                <td className="p-3 text-white">{c.type === "PERCENTAGE" ? `${c.value}%` : `${Number(c.value).toLocaleString("fr-FR")} FCFA`}</td>
                <td className="p-3 text-neutral-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
