import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendWhatsappOrderStatusEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW_REQUEST: "Nouvelle demande",
  PAYMENT_PENDING: "Paiement en attente",
  PAID: "Payé",
  DELIVERED: "Produit envoyé",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const STATUS_ALIASES: Record<string, string> = {
  nouveau: "NEW_REQUEST",
  attente: "PAYMENT_PENDING",
  paye: "PAID",
  "payé": "PAID",
  envoye: "DELIVERED",
  "envoyé": "DELIVERED",
  termine: "COMPLETED",
  "terminé": "COMPLETED",
  annule: "CANCELLED",
  "annulé": "CANCELLED",
};

function normalizeStatus(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key];
  const upper = raw.trim().toUpperCase();
  if (STATUS_LABELS[upper]) return upper;
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const HELP_TEXT = `<b>Commandes disponibles</b>

/commandes — les 10 dernières commandes WhatsApp
/statut &lt;id court&gt; &lt;statut&gt; — changer le statut d'une commande
   statuts: nouveau, attente, paye, envoye, termine, annule
   ex: /statut a1b2c3d4 paye

/produits — liste des produits
/produit &lt;slug&gt; publier|archiver|brouillon — changer le statut d'un produit
   ex: /produit ai-starter-pack publier

/categories — liste des catégories et leurs slugs
/nouveauproduit Nom | Description courte | Prix | slug-categorie | Description complète (optionnel)
   ex: /nouveauproduit Pack Canva | 50 templates Canva | 5000 | templates

/stats — chiffre d'affaires et compteurs
/aide — cette aide`;

async function handleCommandes() {
  const orders = await prisma.whatsappOrder.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (orders.length === 0) return "Aucune commande WhatsApp pour le moment.";

  return orders
    .map((o) => {
      const products = o.items.map((i) => i.productName).join(", ");
      return `<b>${o.id.slice(0, 8)}</b> — ${o.customerName}\n${products}\n${formatPrice(Number(o.total))} — ${STATUS_LABELS[o.status]}`;
    })
    .join("\n\n");
}

async function handleStatut(args: string[]) {
  if (args.length < 2) {
    return "Utilisation : /statut <id court> <statut>\nex: /statut a1b2c3d4 paye";
  }
  const [shortId, ...statusParts] = args;
  const status = normalizeStatus(statusParts.join(" "));
  if (!status) {
    return "Statut inconnu. Utilise : nouveau, attente, paye, envoye, termine, annule";
  }

  const order = await prisma.whatsappOrder.findFirst({
    where: { id: { startsWith: shortId } },
    include: { items: true },
  });
  if (!order) return `Aucune commande ne commence par "${shortId}".`;

  const updated = await prisma.whatsappOrder.update({
    where: { id: order.id },
    data: { status: status as any },
    include: { items: true },
  });

  if (updated.customerEmail && ["PAID", "DELIVERED", "COMPLETED"].includes(status)) {
    try {
      await sendWhatsappOrderStatusEmail({
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        items: updated.items.map((i) => ({ productName: i.productName })),
        total: updated.total,
        status: updated.status,
      });
    } catch (err) {
      console.error("Failed to send status email from bot:", err);
    }
  }

  return `✅ Commande ${updated.id.slice(0, 8)} (${updated.customerName}) → ${STATUS_LABELS[updated.status]}`;
}

async function handleProduits() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  if (products.length === 0) return "Aucun produit pour le moment.";

  const statusLabel: Record<string, string> = { DRAFT: "Brouillon", PUBLISHED: "Publié", ARCHIVED: "Archivé" };

  return products
    .map((p) => `<b>${p.name}</b> (${p.slug})\n${formatPrice(Number(p.price))} — ${p.category.name} — ${statusLabel[p.status]}`)
    .join("\n\n");
}

async function handleProduit(args: string[]) {
  if (args.length < 2) {
    return "Utilisation : /produit <slug> publier|archiver|brouillon";
  }
  const [slug, action] = args;
  const statusMap: Record<string, string> = { publier: "PUBLISHED", archiver: "ARCHIVED", brouillon: "DRAFT" };
  const status = statusMap[action.toLowerCase()];
  if (!status) return "Action inconnue. Utilise : publier, archiver, brouillon";

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return `Aucun produit avec le slug "${slug}".`;

  await prisma.product.update({ where: { slug }, data: { status: status as any } });
  return `✅ ${product.name} → ${action}`;
}

async function handleCategories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  if (categories.length === 0) {
    return "Aucune catégorie pour le moment. Crée-en une depuis /admin/categories sur le site.";
  }
  return categories.map((c) => `${c.name} → <code>${c.slug}</code>`).join("\n");
}

async function handleNouveauProduit(raw: string) {
  const parts = raw.split("|").map((p) => p.trim());
  if (parts.length < 4) {
    return "Utilisation : /nouveauproduit Nom | Description courte | Prix | slug-categorie | Description complète (optionnel)\n\nTape /categories pour voir les slugs disponibles.";
  }

  const [name, shortDescription, priceRaw, categorySlug, description] = parts;
  const price = Number(priceRaw.replace(/[^\d.,]/g, "").replace(",", "."));

  if (!name || !shortDescription || Number.isNaN(price) || !categorySlug) {
    return "Champs invalides. Format : Nom | Description courte | Prix | slug-categorie";
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return `Catégorie "${categorySlug}" introuvable. Tape /categories pour voir les slugs disponibles.`;
  }

  const slug = slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return `Un produit avec le slug "${slug}" existe déjà.`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      shortDescription,
      description: description || shortDescription,
      price,
      categoryId: category.id,
      status: "PUBLISHED",
    },
  });

  return `✅ Produit créé et publié !\n\n<b>${product.name}</b>\n${formatPrice(price)} — ${category.name}\n\nAjoute une image depuis /admin/products sur le site si besoin.`;
}

async function handleStats() {
  const orders = await prisma.whatsappOrder.findMany();
  const revenue = orders
    .filter((o) => ["PAID", "DELIVERED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);
  const pending = orders.filter((o) => o.status === "NEW_REQUEST").length;
  const productCount = await prisma.product.count({ where: { status: "PUBLISHED" } });

  return `<b>Statistiques</b>

💰 Chiffre d'affaires : ${formatPrice(revenue)}
📥 Commandes totales : ${orders.length}
🆕 Nouvelles demandes : ${pending}
📦 Produits publiés : ${productCount}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  const chatId = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  // Bootstrap: reveal the chat id so the owner can lock the bot to it.
  if (!adminChatId) {
    if (text.trim() === "/start") {
      await sendTelegramMessage(
        chatId,
        `Bienvenue. Ton identifiant de discussion est :\n<code>${chatId}</code>\n\nDonne-le à Claude pour verrouiller ce bot sur ton compte.`
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Once locked, only the configured admin chat can use the bot.
  if (String(chatId) !== String(adminChatId)) {
    return NextResponse.json({ ok: true });
  }

  const [command, ...args] = text.trim().split(/\s+/);
  let reply: string;

  try {
    switch (command) {
      case "/start":
      case "/aide":
      case "/help":
        reply = HELP_TEXT;
        break;
      case "/commandes":
        reply = await handleCommandes();
        break;
      case "/statut":
        reply = await handleStatut(args);
        break;
      case "/produits":
        reply = await handleProduits();
        break;
      case "/produit":
        reply = await handleProduit(args);
        break;
      case "/categories":
        reply = await handleCategories();
        break;
      case "/nouveauproduit":
        reply = await handleNouveauProduit(text.trim().slice(command.length).trim());
        break;
      case "/stats":
        reply = await handleStats();
        break;
      default:
        reply = "Commande inconnue. Tape /aide pour la liste des commandes.";
    }
  } catch (err) {
    console.error("Telegram bot command error:", err);
    reply = "Une erreur est survenue en traitant cette commande.";
  }

  await sendTelegramMessage(chatId, reply);
  return NextResponse.json({ ok: true });
}
