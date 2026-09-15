"use client";

import { useEffect, useState } from "react";

type Seller = {
  id: string;
  businessName: string;
  whatsappNumber: string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  user: { email: string };
  _count: { products: number };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
  SUSPENDED: "Suspendu",
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);

  async function load() {
    const res = await fetch("/api/admin/sellers");
    if (res.ok) setSellers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/sellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const pending = sellers.filter((s) => s.status === "PENDING");
  const others = sellers.filter((s) => s.status !== "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Vendeurs</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Demandes en attente</h2>
          <div className="flex flex-col gap-3">
            {pending.map((s) => (
              <div key={s.id} className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 flex flex-col gap-2">
                <p className="text-white font-semibold">{s.businessName}</p>
                <p className="text-sm text-neutral-400">{s.user.email} — {s.whatsappNumber}</p>
                {s.description && <p className="text-sm text-neutral-400">{s.description}</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStatus(s.id, "APPROVED")}
                    className="rounded-lg bg-emerald-500 text-black text-sm font-semibold px-4 py-2">
                    Approuver
                  </button>
                  <button onClick={() => setStatus(s.id, "REJECTED")}
                    className="rounded-lg border border-red-900 text-red-400 text-sm font-semibold px-4 py-2">
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Tous les vendeurs</h2>
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="text-left p-3">Boutique</th>
                <th className="text-left p-3">WhatsApp</th>
                <th className="text-left p-3">Produits</th>
                <th className="text-left p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {others.map((s) => (
                <tr key={s.id} className="border-t border-neutral-900">
                  <td className="p-3 text-white">{s.businessName}</td>
                  <td className="p-3 text-neutral-400">{s.whatsappNumber}</td>
                  <td className="p-3 text-neutral-400">{s._count.products}</td>
                  <td className="p-3">
                    <select value={s.status} onChange={(e) => setStatus(s.id, e.target.value)}
                      className="rounded-lg bg-black border border-neutral-800 px-2 py-1 text-xs text-white">
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
