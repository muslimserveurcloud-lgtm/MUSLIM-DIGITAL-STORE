"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type Item = { productName: string; price: number };
type Order = {
  id: string;
  customerName: string;
  whatsappNumber: string;
  customerEmail?: string | null;
  status: string;
  total: string;
  createdAt: string;
  items: Item[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW_REQUEST: "Nouvelle demande",
  PAYMENT_PENDING: "Paiement en attente",
  PAID: "Payé",
  DELIVERED: "Produit envoyé",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export default function WhatsappOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([{ productName: "", price: 0 }]);
  const [form, setForm] = useState({ customerName: "", whatsappNumber: "", customerEmail: "", notes: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/whatsapp-orders");
    if (res.ok) setOrders(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (res.ok) {
        setForm({ customerName: "", whatsappNumber: "", customerEmail: "", notes: "" });
        setItems([{ productName: "", price: 0 }]);
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/whatsapp-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Commandes WhatsApp</h1>
        <p className="text-sm text-neutral-500">
          Enregistrez manuellement une commande négociée sur WhatsApp et suivez son statut jusqu'à la livraison.
        </p>
      </div>

      <form onSubmit={createOrder} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-white">Nouvelle commande</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Nom du client" value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input required placeholder="Numéro WhatsApp" value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input placeholder="Email (facultatif)" value={form.customerEmail}
            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input placeholder="Notes" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-400">Produits</p>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input placeholder="Nom du produit" value={item.productName}
                onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, productName: e.target.value } : it)))}
                className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
              <input type="number" step="1" placeholder="Prix (FCFA)" value={item.price}
                onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, price: Number(e.target.value) } : it)))}
                className="w-28 rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { productName: "", price: 0 }])}
            className="text-sm text-emerald-400 self-start">
            + Ajouter un produit
          </button>
        </div>

        <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
          {loading ? "Enregistrement..." : "Enregistrer la commande"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">WhatsApp</th>
              <th className="text-left p-3">Produits</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-neutral-900">
                <td className="p-3 text-white">{order.customerName}</td>
                <td className="p-3 text-neutral-400">{order.whatsappNumber}</td>
                <td className="p-3 text-neutral-400">{order.items.map((i) => i.productName).join(", ")}</td>
                <td className="p-3 text-white">{formatPrice(Number(order.total))}</td>
                <td className="p-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="rounded-lg bg-black border border-neutral-800 px-2 py-1 text-xs text-white"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
