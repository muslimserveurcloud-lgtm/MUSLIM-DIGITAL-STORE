import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin account ---------------------------------------------------
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@muslimdigitalstore.com" },
    update: {},
    create: {
      email: "admin@muslimdigitalstore.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      profile: { create: { firstName: "Admin" } },
    },
  });

  // --- Categories --------------------------------------------------------
  const [ia, templates, scripts] = await Promise.all([
    prisma.category.upsert({ where: { slug: "ia" }, update: {}, create: { name: "IA", slug: "ia" } }),
    prisma.category.upsert({ where: { slug: "templates" }, update: {}, create: { name: "Templates", slug: "templates" } }),
    prisma.category.upsert({ where: { slug: "scripts" }, update: {}, create: { name: "Scripts", slug: "scripts" } }),
  ]);

  // --- DEMO PRODUCTS — remove freely via /admin/products or this script --
  await prisma.product.upsert({
    where: { slug: "ai-starter-pack" },
    update: {},
    create: {
      name: "AI Starter Pack",
      slug: "ai-starter-pack",
      description: "Un pack de démarrage pour vos projets liés à l'intelligence artificielle : prompts, guides et ressources.",
      shortDescription: "Pack de démarrage pour vos projets IA.",
      price: 5000,
      categoryId: ia.id,
      status: "PUBLISHED",
      isPopular: true,
      isFeatured: true,
      fileFormat: "PDF + ZIP",
      fileSizeLabel: "45 Mo",
    },
  });

  await prisma.product.upsert({
    where: { slug: "premium-website-template" },
    update: {},
    create: {
      name: "Premium Website Template",
      slug: "premium-website-template",
      description: "Un template de site web premium, prêt à personnaliser pour votre marque.",
      shortDescription: "Template de site web premium et moderne.",
      price: 10000,
      categoryId: templates.id,
      status: "PUBLISHED",
      isFeatured: true,
      fileFormat: "HTML/CSS/JS",
      fileSizeLabel: "12 Mo",
    },
  });

  await prisma.product.upsert({
    where: { slug: "developer-scripts-pack" },
    update: {},
    create: {
      name: "Developer Scripts Pack",
      slug: "developer-scripts-pack",
      description: "Une collection de scripts utiles pour automatiser vos tâches de développement.",
      shortDescription: "Collection de scripts pour développeurs.",
      price: 7500,
      categoryId: scripts.id,
      status: "PUBLISHED",
      isPopular: true,
      fileFormat: "ZIP",
      fileSizeLabel: "8 Mo",
    },
  });

  console.log("✅ Seed terminé. Compte admin : admin@muslimdigitalstore.com / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
