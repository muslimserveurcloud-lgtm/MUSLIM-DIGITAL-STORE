"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

type Category = { id: string; name: string };
type Product = {
  id: string; name: string; slug: string; price: string; status: string; category: Category;
};

const EMPTY_FORM = {
  name: "", slug: "", description: "", shortDescription: "",
  price: 0, categoryId: "", status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/seller/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()).catch(() => []),
    ]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => {
    load();
  }, []);

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(product: Product) {
    const next = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/seller/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function removeProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Mes produits</h1>

      <form onSubmit={createProduct} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-white">Nouveau produit</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Nom" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input required placeholder="Slug" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input required type="number" step="1" placeholder="Prix (FCFA)" value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white">
            <option value="">Catégorie...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <input required placeholder="Description courte" value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        <textarea required placeholder="Description complète" rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
          {loading ? "Création..." : "Créer le produit"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Prix</th>
              <th className="text-left p-3">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-neutral-900">
                <td className="p-3 text-white">{p.name}</td>
                <td className="p-3 text-white">{Number(p.price).toLocaleString("fr-FR")} FCFA</td>
                <td className="p-3">
                  <button onClick={() => toggleStatus(p)} className={`text-xs rounded-full px-2 py-1 ${p.status === "PUBLISHED" ? "bg-emerald-900 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>
                    {p.status === "PUBLISHED" ? "Publié" : p.status === "DRAFT" ? "Brouillon" : "Archivé"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => removeProduct(p.id)} className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
