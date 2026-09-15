import { Resend } from "resend";
import { storeConfig } from "@/lib/config";

const resend = new Resend(process.env.EMAIL_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "MUSLIM DIGITAL STORE <no-reply@muslimdigitalstore.com>";

function wrap(title: string, bodyHtml: string) {
  return `
  <div style="background:#0a0a0a;padding:32px 0;font-family:sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:16px;padding:32px;color:#e5e5e5;">
      <h1 style="color:#fff;font-size:20px;margin-bottom:8px;">MUSLIM DIGITAL STORE</h1>
      <h2 style="color:#34d399;font-size:16px;margin-bottom:16px;">${title}</h2>
      ${bodyHtml}
      <p style="color:#737373;font-size:12px;margin-top:32px;">MUSLIM DIGITAL STORE — Le digital. Simple. Puissant. Accessible.</p>
    </div>
  </div>`;
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Bienvenue sur MUSLIM DIGITAL STORE",
    html: wrap("Bienvenue !", `<p>Bonjour ${firstName || ""}, votre compte a été créé avec succès.</p>`),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: wrap(
      "Réinitialisation du mot de passe",
      `<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans 1 heure.</p>
       <p><a href="${resetUrl}" style="color:#34d399;">Réinitialiser mon mot de passe</a></p>`
    ),
  });
}

// Sent when an admin updates a WhatsApp order's status to "Payé" or
// "Produit envoyé". Only fires if the customer gave an email during the
// WhatsApp exchange. Requires a real EMAIL_API_KEY to actually send —
// see README section 8 (still a placeholder key by default).
const WHATSAPP_STATUS_LABELS: Record<string, string> = {
  PAID: "Payé",
  DELIVERED: "Produit envoyé",
  COMPLETED: "Terminée",
};

export async function sendWhatsappOrderStatusEmail(order: {
  customerName: string;
  customerEmail: string;
  items: { productName: string }[];
  total: unknown;
  status: string;
}) {
  const statusLabel = WHATSAPP_STATUS_LABELS[order.status] ?? order.status;
  const productList = order.items.map((i) => `<li>${i.productName}</li>`).join("");

  await resend.emails.send({
    from: FROM,
    to: order.customerEmail,
    subject: `Votre commande ${storeConfig.name} — ${statusLabel}`,
    html: wrap(
      statusLabel,
      `<p>Bonjour ${order.customerName},</p>
       <p>Le statut de votre commande a été mis à jour : <strong>${statusLabel}</strong>.</p>
       <ul>${productList}</ul>
       <p>Pour toute question, répondez-nous directement sur WhatsApp.</p>`
    ),
  });
}

// Sent once an order is actually confirmed as paid (online-payment path,
// currently dormant — see src/lib/services/payment-service.ts).
export async function sendOrderPaidEmail(order: { id: string; customerEmail: string; total: unknown }, downloads: { token: string }[]) {
  const links = downloads
    .map((d) => `<li><a href="${process.env.NEXT_PUBLIC_APP_URL}/account/downloads?token=${d.token}">Télécharger</a></li>`)
    .join("");

  await resend.emails.send({
    from: FROM,
    to: order.customerEmail,
    subject: "Votre commande est confirmée — vos téléchargements sont prêts",
    html: wrap(
      "Paiement confirmé",
      `<p>Votre commande #${order.id} a été payée avec succès. Vos produits sont disponibles :</p><ul>${links}</ul>`
    ),
  });
}
