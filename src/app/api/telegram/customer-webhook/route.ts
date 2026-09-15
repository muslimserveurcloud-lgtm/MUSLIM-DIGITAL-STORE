import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { buildSingleProductWhatsappLink } from "@/lib/whatsapp";
import { sendCustomerMessage, answerCallbackQuery, notifyAdminNewOrder, InlineButton } from "@/lib/telegram-customer";

export const dynamic = "force-dynamic";

async function shopKeyboard(): Promise<{ text: string; buttons: InlineButton[][] }> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (products.length === 0) {
    return { text: "Aucun produit disponible pour le moment.", buttons: [] };
  }

  const buttons: InlineButton[][] = products.map((p) => [
    {
      text: `${p.name} — ${formatPrice(Number(p.salePrice ?? p.price))}`,
      callback_data: `view:${p.slug}`,
    },
  ]);

  return { text: "🛍️ Voici nos produits disponibles :", buttons };
}

async function productDetails(slug: string): Promise<{ text: string; buttons: InlineButton[][] } | null> {
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true, seller: true } });
  if (!product || product.status !== "PUBLISHED") return null;

  const price = Number(product.salePrice ?? product.price);
  const sellerLine = product.seller ? `\n👤 Vendu par ${product.seller.businessName}` : "";
  const text = `<b>${product.name}</b>\n${product.shortDescription}\n\n💰 ${formatPrice(price)}\n📂 ${product.category.name}${sellerLine}`;
  const whatsappUrl = buildSingleProductWhatsappLink({ name: product.name, price, slug: product.slug }, product.seller?.whatsappNumber);

  const buttons: InlineButton[][] = [
    [{ text: "🛒 Acheter", callback_data: `buy:${product.slug}` }],
    [{ text: "💬 Contacter sur WhatsApp", url: whatsappUrl }],
    [{ text: "⬅️ Retour à la boutique", callback_data: "shop" }],
  ];

  return { text, buttons };
}

async function handleBuy(slug: string, from: any): Promise<string> {
  const product = await prisma.product.findUnique({ where: { slug }, include: { seller: true } });
  if (!product || product.status !== "PUBLISHED") {
    return "Ce produit n'est plus disponible.";
  }

  const price = Number(product.salePrice ?? product.price);
  const customerName = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Client Telegram";
  const contact = from?.username ? `Telegram: @${from.username}` : `Telegram ID: ${from?.id ?? "inconnu"}`;

  const order = await prisma.whatsappOrder.create({
    data: {
      customerName,
      whatsappNumber: contact,
      total: price,
      notes: "Commande reçue via le bot Telegram client",
      sellerId: product.sellerId,
      items: { create: [{ productId: product.id, productName: product.name, price }] },
    },
  });

  const sellerLine = product.seller ? `\n🏪 Vendeur : ${product.seller.businessName} (${product.seller.whatsappNumber})` : "";
  await notifyAdminNewOrder(
    `🆕 Nouvelle commande via le bot Telegram\n\n👤 ${customerName} (${contact})\n🛍️ ${product.name}\n💰 ${formatPrice(price)}${sellerLine}\n\nID: ${order.id.slice(0, 8)}`
  );

  return `✅ Votre demande pour <b>${product.name}</b> a bien été transmise ! Notre équipe va vous contacter très vite pour finaliser le paiement et vous envoyer votre produit.`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // Button clicks
  if (body.callback_query) {
    const cq = body.callback_query;
    const chatId = cq.message?.chat?.id;
    const data: string = cq.data ?? "";
    await answerCallbackQuery(cq.id);

    if (!chatId) return NextResponse.json({ ok: true });

    if (data === "shop") {
      const { text, buttons } = await shopKeyboard();
      await sendCustomerMessage(chatId, text, buttons);
    } else if (data.startsWith("view:")) {
      const slug = data.slice("view:".length);
      const details = await productDetails(slug);
      if (details) await sendCustomerMessage(chatId, details.text, details.buttons);
      else await sendCustomerMessage(chatId, "Ce produit n'existe plus.");
    } else if (data.startsWith("buy:")) {
      const slug = data.slice("buy:".length);
      const reply = await handleBuy(slug, cq.from);
      await sendCustomerMessage(chatId, reply);
    }

    return NextResponse.json({ ok: true });
  }

  // Text messages
  const message = body.message;
  const chatId = message?.chat?.id;
  const text: string | undefined = message?.text;
  if (!chatId || !text) return NextResponse.json({ ok: true });

  const command = text.trim().split(/\s+/)[0];

  if (command === "/start" || command === "/boutique" || command === "/catalogue") {
    const { text: shopText, buttons } = await shopKeyboard();
    const intro = command === "/start" ? "👋 Bienvenue sur MUSLIM DIGITAL STORE !\n\n" : "";
    await sendCustomerMessage(chatId, intro + shopText, buttons);
  } else if (command === "/aide" || command === "/help") {
    await sendCustomerMessage(
      chatId,
      "Tape /boutique pour voir nos produits, ou clique sur un bouton pour en savoir plus et commander."
    );
  } else {
    await sendCustomerMessage(chatId, "Je n'ai pas compris. Tape /boutique pour voir nos produits.");
  }

  return NextResponse.json({ ok: true });
}
