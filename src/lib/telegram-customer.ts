const TELEGRAM_API = "https://api.telegram.org";

export type InlineButton = { text: string; callback_data?: string; url?: string };

function token() {
  return process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
}

/** Sends a message from the customer bot, optionally with inline keyboard buttons. */
export async function sendCustomerMessage(chatId: string | number, text: string, buttons?: InlineButton[][]) {
  const t = token();
  if (!t) {
    console.error("TELEGRAM_CUSTOMER_BOT_TOKEN is not configured");
    return;
  }

  await fetch(`${TELEGRAM_API}/bot${t}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: buttons && buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

/** Required after handling a button click, or the button spinner never stops on the user's end. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const t = token();
  if (!t) return;

  await fetch(`${TELEGRAM_API}/bot${t}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

/**
 * Notifies the store owner (via TELEGRAM_ADMIN_CHAT_ID) using the customer
 * bot's own token. This only works once the owner has pressed /start on
 * the customer bot at least once — Telegram requires that per-bot opt-in.
 */
export async function notifyAdminNewOrder(text: string) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;
  await sendCustomerMessage(adminChatId, text);
}
