// @ts-ignore
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import pino from "pino";
import { useDbAuthState } from "./db-auth-state";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "waiting_for_pairing";

let sock: any = null;
let currentPairingCode: string | null = null;
let pairingCodeRequestedAt = 0;
let connectionStatus: ConnectionStatus = "disconnected";
let starting = false;

const AUTO_REPLY_TEXT =
  process.env.WHATSAPP_BOT_AUTO_REPLY ??
  "Merci pour votre message ! Notre équipe vous répondra très bientôt. En attendant, découvrez nos produits sur notre boutique en ligne 🙂";

// Avoid spamming the same contact — one auto-reply per hour per conversation.
const repliedRecently = new Map<string, number>();
const REPLY_COOLDOWN_MS = 60 * 60 * 1000;

export function getWhatsappBotStatus() {
  return { status: connectionStatus, pairingCode: currentPairingCode };
}

export async function startWhatsappBot() {
  if (sock || starting) return;
  starting = true;
  connectionStatus = "connecting";

  try {
    const { state, saveCreds } = await useDbAuthState();
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update: any) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        connectionStatus = "connected";
        currentPairingCode = null;
        console.log("[whatsapp-bot] connected");
      }

      if (connection === "close") {
        connectionStatus = "disconnected";
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        // Only treat this as a real, permanent logout if we had already
        // fully paired before. During the pairing flow itself, WhatsApp
        // routinely closes the provisional socket right after issuing a
        // pairing code — that's expected, not a real logout, so we must
        // keep retrying with the same (now pairing-in-progress) creds.
        const wasFullyRegistered = sock?.authState?.creds?.registered;
        const permanentLogout = statusCode === DisconnectReason.loggedOut && wasFullyRegistered;
        sock = null;
        starting = false;
        if (!permanentLogout) {
          setTimeout(() => startWhatsappBot(), 5000);
        } else {
          console.log("[whatsapp-bot] logged out — re-pairing required");
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        const from = msg.key.remoteJid as string | undefined;
        if (!from || from.endsWith("@g.us")) continue; // ignore group chats

        const last = repliedRecently.get(from);
        const now = Date.now();
        if (last && now - last < REPLY_COOLDOWN_MS) continue;
        repliedRecently.set(from, now);

        try {
          await sock.sendMessage(from, { text: AUTO_REPLY_TEXT });
        } catch (err) {
          console.error("[whatsapp-bot] failed to send auto-reply:", err);
        }
      }
    });

    if (!state.creds.registered) {
      const phoneNumber = process.env.WHATSAPP_BOT_NUMBER;
      // Don't spam a fresh code on every 5s reconnect attempt — WhatsApp
      // codes stay valid for a short while, so only request a new one if
      // we don't have one yet or the last one is stale (>50s old).
      const codeIsStale = Date.now() - pairingCodeRequestedAt > 50000;
      if (phoneNumber && (!currentPairingCode || codeIsStale)) {
        connectionStatus = "waiting_for_pairing";
        await waitForSocketOpen(sock);
        try {
          const code = await sock.requestPairingCode(phoneNumber);
          currentPairingCode = code;
          pairingCodeRequestedAt = Date.now();
          console.log("[whatsapp-bot] pairing code:", code);
        } catch (err) {
          console.error("[whatsapp-bot] failed to request pairing code:", err);
        }
      } else if (!phoneNumber) {
        console.error("[whatsapp-bot] WHATSAPP_BOT_NUMBER is not configured");
      }
    }
  } finally {
    starting = false;
  }
}

function waitForSocketOpen(socket: any, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    if (socket?.ws?.readyState === 1) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    socket?.ws?.on?.("open", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
