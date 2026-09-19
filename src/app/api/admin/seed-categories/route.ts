import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORIES: { name: string; slug: string }[] = [
  { name: "💻 Logiciels & Applications", slug: "logiciels-applications" },
  { name: "🤖 Intelligence Artificielle", slug: "intelligence-artificielle" },
  { name: "🎨 Design & Graphisme", slug: "design-graphisme" },
  { name: "📚 E-books & Livres numériques", slug: "ebooks-livres-numeriques" },
  { name: "🎓 Formations & Cours", slug: "formations-cours" },
  { name: "📄 Documents & Templates", slug: "documents-templates" },
  { name: "🌐 Sites Web & Templates", slug: "sites-web-templates" },
  { name: "📱 Applications mobiles", slug: "applications-mobiles" },
  { name: "🎵 Musique & Audio", slug: "musique-audio" },
  { name: "🎬 Vidéos & Contenus", slug: "videos-contenus" },
  { name: "📸 Images & Ressources graphiques", slug: "images-ressources-graphiques" },
  { name: "🧩 Plugins & Extensions", slug: "plugins-extensions" },
  { name: "💼 Business & Entrepreneuriat", slug: "business-entrepreneuriat" },
  { name: "📈 Marketing & Réseaux sociaux", slug: "marketing-reseaux-sociaux" },
  { name: "🔐 Cybersécurité & Outils", slug: "cybersecurite-outils" },
  { name: "⚙️ Automatisation & Bots", slug: "automatisation-bots" },
  { name: "☁️ Cloud & Services numériques", slug: "cloud-services-numeriques" },
  { name: "🛠️ Outils pour développeurs", slug: "outils-developpeurs" },
  { name: "🎮 Gaming & Ressources", slug: "gaming-ressources" },
  { name: "⭐ Packs & Bundles", slug: "packs-bundles" },
  { name: "🔥 Nouveautés", slug: "nouveautes" },
  { name: "🏆 Meilleures ventes", slug: "meilleures-ventes" },
  { name: "💎 Produits premium", slug: "produits-premium" },
  { name: "🆓 Produits gratuits", slug: "produits-gratuits" },
  { name: "💰 Promotions", slug: "promotions" },
  { name: "🎁 Packs exclusifs", slug: "packs-exclusifs" },
];

// One-time bulk seed. Reuses ADMIN_BOOTSTRAP_SECRET (already configured) —
// no new env var needed. Safe to call more than once: upsert skips
// categories that already exist instead of duplicating them.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const created: string[] = [];
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    created.push(result.slug);
  }

  return NextResponse.json({ ok: true, count: created.length, slugs: created });
}
