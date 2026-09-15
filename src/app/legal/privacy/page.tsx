export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose prose-invert prose-sm">
      <h1>Politique de confidentialité</h1>
      <p>
        Nous collectons uniquement les informations nécessaires au traitement de votre commande
        (nom, email, numéro WhatsApp) et ne les partageons avec aucun tiers à des fins commerciales.
      </p>
      <h2>Données collectées</h2>
      <p>Nom, email, numéro de téléphone, historique de commandes.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l'accès, la correction ou la suppression de vos données via la page Contact.</p>
      <p className="text-neutral-500 text-xs mt-8">Document à faire relire par un professionnel du droit avant mise en production.</p>
    </div>
  );
}
