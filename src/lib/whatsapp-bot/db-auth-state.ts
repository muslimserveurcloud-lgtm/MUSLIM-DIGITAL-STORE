import { prisma } from "@/lib/prisma";
// @ts-ignore — no bundled types issue at runtime, Baileys ships its own types
import { initAuthCreds, BufferJSON, proto } from "@whiskeysockets/baileys";

async function readData(key: string) {
  const row = await prisma.whatsappBotSession.findUnique({ where: { key } });
  if (!row) return null;
  return JSON.parse(JSON.stringify(row.value), BufferJSON.reviver);
}

async function writeData(key: string, value: unknown) {
  const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
  await prisma.whatsappBotSession.upsert({
    where: { key },
    update: { value: serialized },
    create: { key, value: serialized },
  });
}

async function removeData(key: string) {
  await prisma.whatsappBotSession.deleteMany({ where: { key } });
}

/**
 * Render's disk is wiped on every restart/redeploy, so the usual
 * file-based Baileys auth state (useMultiFileAuthState) would force a
 * fresh pairing every time the service wakes up. This stores the same
 * data in Postgres instead, so the WhatsApp session survives restarts.
 */
export async function useDbAuthState() {
  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, any> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: Record<string, Record<string, unknown>>) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData("creds", creds);
    },
  };
}
