"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

type Category = { id: string; name: string; slug: string; _count: { products: number } };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) {
        setName("");
        setSlug("");
        await load();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Erreur lors de la création");
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Impossible de supprimer cette catégorie");
      return;
    }
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Catégories</h1>

      <form onSubmit={createCategory} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col gap-3 max-w-lg">
        <h2 className="font-semibold text-white">Nouvelle catégorie</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Nom (ex: E-books)" value={name}
            onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input required placeholder="Slug (ex: e-books)" value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
          {loading ? "Création..." : "Créer la catégorie"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Produits</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Aucune catégorie pour le moment.</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="border-t border-neutral-900">
                <td className="p-3 text-white">{c.name}</td>
                <td className="p-3 text-neutral-400 font-mono">{c.slug}</td>
                <td className="p-3 text-neutral-400">{c._count.products}</td>
                <td className="p-3 text-right">
                  <button onClick={() => removeCategory(c.id)} className="text-neutral-500 hover:text-red-400">
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
