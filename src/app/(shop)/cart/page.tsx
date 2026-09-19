"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { WhatsappCartCheckoutButton } from "@/components/cart/WhatsappCartCheckoutButton";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem } = useCart();
  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Mon panier</h1>

      {items.length === 0 ? (
        <p className="text-neutral-400">Votre panier est vide.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{item.name}</p>
                <p className="text-sm text-neutral-500">{formatPrice(item.price)}</p>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label="Retirer du panier"
                className="text-neutral-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col gap-3">
            <div className="flex justify-between text-neutral-300">
              <span>Total</span>
              <span className="font-bold text-white">{formatPrice(total)}</span>
            </div>
            <p className="text-sm text-neutral-500">
              Pour finaliser votre commande, contactez-nous sur WhatsApp. Nous vous confirmerons le paiement et la
              livraison de vos produits.
            </p>
            <WhatsappCartCheckoutButton items={items.map((i) => ({ name: i.name, price: i.price }))} />
          </div>
        </div>
      )}
    </div>
  );
}
