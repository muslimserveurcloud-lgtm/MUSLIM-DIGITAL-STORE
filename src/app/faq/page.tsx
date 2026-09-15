const FAQS = [
  {
    q: "Comment recevoir mon produit ?",
    a: "Après avoir cliqué sur « Acheter maintenant », vous êtes redirigé vers WhatsApp avec un message pré-rempli. Notre équipe confirme le paiement puis vous envoie votre produit directement.",
  },
  {
    q: "Quand vais-je recevoir mon téléchargement ?",
    a: "Dès que votre paiement est confirmé par notre équipe sur WhatsApp, votre produit vous est envoyé rapidement.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Les moyens de paiement sont discutés directement avec vous sur WhatsApp selon votre pays et votre préférence.",
  },
  {
    q: "Puis-je télécharger mon produit plusieurs fois ?",
    a: "Contactez-nous sur WhatsApp si vous avez besoin d'un nouvel envoi de votre produit.",
  },
  {
    q: "Que faire si mon téléchargement ne fonctionne pas ?",
    a: "Écrivez-nous directement sur WhatsApp, nous vous enverrons un nouveau lien ou fichier rapidement.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Questions fréquentes</h1>
      <div className="flex flex-col divide-y divide-neutral-900">
        {FAQS.map((item) => (
          <details key={item.q} className="py-4 group">
            <summary className="cursor-pointer text-white font-medium list-none flex justify-between items-center">
              {item.q}
              <span className="text-neutral-500 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-neutral-400 text-sm mt-2">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
