export async function register() {
  // Only run in the real Node.js server process — not in the edge runtime
  // or during the build's trace collection.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWhatsappBot } = await import("@/lib/whatsapp-bot/client");
    startWhatsappBot().catch((err) => console.error("[whatsapp-bot] failed to start:", err));
  }
}
