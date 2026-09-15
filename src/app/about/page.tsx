import { storeConfig } from "@/lib/config";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose prose-invert prose-sm">
      <h1>À propos de {storeConfig.name}</h1>
      <p>
        {storeConfig.name} est une boutique numérique dédiée aux créateurs, apprenants et développeurs.
        Nous proposons des e-books, formations, templates, scripts et ressources conçus pour vous aider
        à avancer plus vite sur vos projets.
      </p>
      <p>
        Chaque achat est accompagné d'un contact humain sur WhatsApp, pour une expérience simple,
        directe et rassurante.
      </p>
    </div>
  );
}
