"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Category = { id: string; name: string };
type Product = {
  id: string; name: string; slug: string; price: string; salePrice: string | null;
  status: string; category: Category; isFeatured: boolean; isPopular: boolean;
};

const EMPTY_FORM = {
  name: "", slug: "", description: "", shortDescription: "",
  price: 0, salePrice: undefined as number | undefined, categoryId: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  fileFormat: "", fileSizeLabel: "", isFeatured: false, isPopular: false,
  imageUrl: "", externalLink: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const rowImageInput = useRef<HTMLInputElement>(null);
  const rowFileInput = useRef<HTMLInputElement>(null);
  const [rowUploadTarget, setRowUploadTarget] = useState<{ id: string; kind: "image" | "file" } | null>(null);

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
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

  async function uploadFiles(productId: string, image: File | null, file: File | null) {
    if (!image && !file) return;
    const body = new FormData();
    body.append("productId", productId);
    if (image) body.append("image", image);
    if (file) body.append("file", file);
    await fetch("/api/admin/products/upload", { method: "POST", body });
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const product = await res.json();
        await uploadFiles(product.id, imageFile, productFile);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setProductFile(null);
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(product: Product) {
    const next = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function removeProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  function triggerRowUpload(id: string, kind: "image" | "file") {
    setRowUploadTarget({ id, kind });
    if (kind === "image") rowImageInput.current?.click();
    else rowFileInput.current?.click();
  }

  async function handleRowFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected || !rowUploadTarget) return;
    setUploadingId(rowUploadTarget.id);
    try {
      await uploadFiles(
        rowUploadTarget.id,
        rowUploadTarget.kind === "image" ? selected : null,
        rowUploadTarget.kind === "file" ? selected : null
      );
    } finally {
      setUploadingId(null);
      setRowUploadTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Produits</h1>

      {/* Hidden inputs reused for per-row uploads */}
      <input ref={rowImageInput} type="file" accept="image/*" className="hidden" onChange={handleRowFileSelected} />
      <input ref={rowFileInput} type="file" className="hidden" onChange={handleRowFileSelected} />

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
          <input type="number" step="1" placeholder="Prix promo en FCFA (optionnel)" value={form.salePrice ?? ""}
            onChange={(e) => setForm({ ...form, salePrice: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white">
            <option value="">Catégorie...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white">
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>
        <input required placeholder="Description courte" value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        <textarea required placeholder="Description complète" rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Image du produit (max 3 Mo)
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-white" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Fichier numérique à livrer (max 10 Mo)
            <input type="file" onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
              className="text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-white" />
          </label>
          <input placeholder="Ou lien d'image (URL, optionnel)" value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
          <input placeholder="Lien externe (démo, site vendeur — optionnel)" value={form.externalLink}
            onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
            className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm text-white" />
        </div>

        <div className="flex gap-4 text-sm text-neutral-400">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Produit vedette
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
            Produit populaire
          </label>
        </div>
        <button disabled={loading} className="self-start rounded-lg bg-emerald-500 text-black text-sm font-semibold px-5 py-2 disabled:opacity-50">
          {loading ? "Création..." : "Créer le produit"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Catégorie</th>
              <th className="text-left p-3">Prix</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Fichiers</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-neutral-900">
                <td className="p-3 text-white">{p.name}</td>
                <td className="p-3 text-neutral-400">{p.category?.name}</td>
                <td className="p-3 text-white">{formatPrice(Number(p.price))}</td>
                <td className="p-3">
                  <button onClick={() => toggleStatus(p)} className={`text-xs rounded-full px-2 py-1 ${p.status === "PUBLISHED" ? "bg-emerald-900 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>
                    {p.status === "PUBLISHED" ? "Publié" : p.status === "DRAFT" ? "Brouillon" : "Archivé"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button disabled={uploadingId === p.id} onClick={() => triggerRowUpload(p.id, "image")}
                      title="Uploader une image" className="text-neutral-500 hover:text-emerald-400 disabled:opacity-50">
                      <ImageIcon size={16} />
                    </button>
                    <button disabled={uploadingId === p.id} onClick={() => triggerRowUpload(p.id, "file")}
                      title="Uploader le fichier numérique" className="text-neutral-500 hover:text-emerald-400 disabled:opacity-50">
                      <Upload size={16} />
                    </button>
                    {uploadingId === p.id && <span className="text-xs text-neutral-500">...</span>}
                  </div>
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
