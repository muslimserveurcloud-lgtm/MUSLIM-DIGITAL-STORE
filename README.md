# MUSLIM DIGITAL STORE

Boutique en ligne de produits numériques (e-books, formations, templates, scripts, codes sources...).
**Parcours d'achat actuel : WhatsApp.** Aucun paiement en ligne n'est activé pour le moment — chaque achat
est finalisé manuellement avec l'équipe sur WhatsApp, puis enregistré par un admin.

---

## 1. Ce qui est réellement fonctionnel dans ce projet

- Catalogue produits (boutique, recherche, filtres, tri, page produit avec données structurées SEO) — branché sur une vraie base PostgreSQL via Prisma.
- Panier client (persistant en local) → génère un message WhatsApp pré-rempli et correctement encodé vers le numéro configuré.
- Bouton "Acheter maintenant" sur chaque produit → ouvre WhatsApp avec le produit et son prix pré-remplis.
- Authentification complète : inscription, connexion, déconnexion, mot de passe oublié / réinitialisation (token à usage unique, haché, expirant), changement de mot de passe depuis le compte. Mots de passe toujours hashés avec bcrypt, jamais stockés en clair.
- Espace compte client (`/account`) : profil, historique des commandes WhatsApp associées à l'email, sécurité.
- Espace admin protégé côté serveur (jamais uniquement côté client) :
  - Dashboard avec métriques (CA, commandes, clients, produits)
  - **Gestion manuelle des commandes WhatsApp** (création, suivi de statut : Nouvelle demande → Paiement en attente → Payé → Produit envoyé → Terminée / Annulée)
  - Gestion des produits (création, statut brouillon/publié/archivé, produit vedette/populaire, suppression)
  - Gestion des codes promo (pourcentage ou montant fixe, expiration, plafond d'utilisation)
- Pages complémentaires : FAQ, Contact (avec protection anti-spam par honeypot), À propos, CGV, Politique de confidentialité, Politique de remboursement, 404, newsletter.
- SEO : sitemap.xml et robots.txt générés dynamiquement, URLs propres, meta/OpenGraph par produit, données structurées JSON-LD.
- Système d'avis clients (soumission connectée, modération admin requise avant publication — voir `Review.isApproved`).
- Schéma de base de données complet (utilisateurs, produits, commandes, paiements, téléchargements, coupons, avis, commandes WhatsApp...).
- Architecture de téléchargement sécurisé (liens à token aléatoire, expirables, à nombre d'usages limité) et de paiement en ligne (Stripe) : **codées et prêtes, mais non branchées au parcours d'achat actuel**, pour le jour où vous activerez le paiement en ligne.

## 1bis. Ce qui reste volontairement simplifié (à étoffer si besoin)

- La modération des avis clients et l'upload des fichiers produits se font via Prisma Studio ou à construire en interface dédiée — les API et le schéma sont prêts.
- La page de gestion des commandes en ligne (`/admin/orders`, pour le futur parcours Stripe) n'a pas d'interface dédiée tant que ce parcours est dormant.
- Le rapprochement compte client ↔ commande WhatsApp se fait par email (best-effort), puisque l'achat a lieu hors plateforme par design.

## 2. Ce qui nécessite votre configuration avant mise en production

| Élément | Statut | À faire |
|---|---|---|
| Numéro WhatsApp | ✅ configuré (`237697929580`) | Modifiable dans `.env` (`NEXT_PUBLIC_WHATSAPP_NUMBER`) sans toucher au code |
| Base de données | Schéma prêt | Créer une base PostgreSQL et renseigner `DATABASE_URL` |
| Stockage des fichiers numériques | Code prêt (S3-compatible) | Créer un bucket privé et renseigner les clés `STORAGE_*` |
| Emails transactionnels | Code prêt (Resend) | Créer un compte Resend et renseigner `EMAIL_API_KEY` |
| Paiement en ligne (Stripe) | Codé, **dormant** | À activer uniquement si vous voulez un jour un paiement automatique en plus de WhatsApp |
| Images produits demo | Non fournies | Ajouter vos visuels dans `/admin/products` ou `public/` |

Aucune clé réelle n'est présente dans le code — voir `.env.example`.

---

## 3. Installation

```bash
npm install
cp .env.example .env   # puis renseigner vos vraies valeurs
```

## 4. Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed   # crée le compte admin + 3 produits de démonstration
```

Compte admin de démonstration créé par le seed :
`admin@muslimdigitalstore.com` / `ChangeMe123!` — **à changer immédiatement.**

## 5. Lancer en local

```bash
npm run dev
```

Le site est disponible sur `http://localhost:3000`, l'admin sur `/admin`.

## 6. Configurer le numéro WhatsApp

Tout le site lit une seule source de vérité :

```
# .env
NEXT_PUBLIC_WHATSAPP_NUMBER=237697929580
```

Changez cette valeur pour mettre à jour tous les boutons d'achat du site instantanément.

## 7. Supprimer les produits de démonstration

Depuis `/admin/products`, ou directement :

```bash
npx prisma studio
```

## 8. Activer le paiement en ligne plus tard (optionnel)

L'architecture est prête (`src/lib/services/payment-service.ts`, `src/app/api/webhooks/payment/route.ts`) :

1. Renseigner `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET` dans `.env`.
2. Configurer le webhook Stripe vers `/api/webhooks/payment`.
3. Relier le bouton de checkout à `initiatePayment()`.

Un paiement n'est **jamais** validé côté client — uniquement après vérification de la signature du
webhook du fournisseur, côté serveur.

## 9. Déploiement

- Hébergement recommandé : Vercel (Next.js) + base PostgreSQL managée (Neon, Supabase, RDS...).
- Renseigner toutes les variables d'environnement dans les paramètres du projet d'hébergement.
- Lancer `npx prisma migrate deploy` en production (pas `migrate dev`).
- Pointer votre domaine, puis mettre à jour `NEXT_PUBLIC_APP_URL`.

---

## Structure du projet

```
src/
  app/            pages (accueil, boutique, produit, panier, admin, API routes)
  components/     composants réutilisables (shop, cart, admin, layout)
  lib/
    services/     order-service, download-service, payment-service (logique métier)
    storage/      wrapper stockage privé S3-compatible
    auth/         configuration NextAuth
    whatsapp.ts   génération des liens wa.me
    config.ts     configuration centralisée (numéro WhatsApp, etc.)
prisma/
  schema.prisma   schéma complet de la base de données
  seed.ts         données de démonstration
```
