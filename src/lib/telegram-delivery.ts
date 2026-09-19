import { prisma } from "@/lib/prisma";

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Sends every purchased product's file to the customer via the CUSTOMER
 * Telegram bot (the one the buyer already talked to). Only runs for
 * orders that have a telegramChatId on file (i.e. came from that bot).
 * Silently does nothing if there's no chat id, no token, or no files —
 * this must never block or break an admin status update.
 */
export async function deliverWhatsappOrderViaTelegram(orderId: string) {
  const token = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
  if (!token) return;

  const order = await prisma.whatsappOrder.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { files: true } } } } },
  });
  if (!order?.telegramChatId) return;

  const chatId = order.telegramChatId;

  for (const item of order.items) {
    const files = item.product?.files ?? [];
    if (files.length === 0) continue;

    for (const file of files) {
      try {
        if (file.fileData) {
          await sendDocumentBytes(token, chatId, Buffer.from(file.fileData), file.fileName);
        }
        // Files stored via S3 (storageKey set, no fileData) aren't wired up
        // for Telegram delivery yet — only DB-stored files are supported here.
      } catch (err) {
        console.error("[telegram-delivery] failed to send file:", err);
      }
    }
  }

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Paiement confirmé ! Voici votre produit — merci pour votre achat 🙏",
      }),
    });
  } catch (err) {
    console.error("[telegram-delivery] failed to send confirmation message:", err);
  }
}

async function sendDocumentBytes(token: string, chatId: string, buffer: Buffer, fileName: string) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", new Blob([new Uint8Array(buffer)]), fileName);

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`sendDocument failed (${res.status}): ${text}`);
  }
}
