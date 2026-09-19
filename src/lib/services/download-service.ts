import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage/s3";

const EXPIRY_MINUTES = Number(process.env.DOWNLOAD_LINK_EXPIRY_MINUTES ?? 60);
const MAX_DOWNLOADS = Number(process.env.DOWNLOAD_MAX_ATTEMPTS ?? 5);

/**
 * Called after an order is marked PAID. Generates one Download record
 * (with an unguessable token) per purchased file. The token — not the
 * storage key — is what ever reaches the client or an email.
 */
export async function grantDownloadsForOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: { include: { files: true } } } } },
  });

  const grants = [];
  for (const item of order.items) {
    for (const file of item.product.files) {
      const token = randomBytes(32).toString("hex"); // 64 hex chars, unguessable
      const download = await prisma.download.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          productFileId: file.id,
          token,
          expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60_000),
          maxDownloads: MAX_DOWNLOADS,
        },
      });
      grants.push(download);
    }
  }
  return grants;
}

/**
 * Resolves a download token to a short-lived, signed URL to the private
 * file. Never returns the raw storage path. Enforces expiry + attempt cap
 * and that the requesting user actually owns this grant.
 */
export async function resolveDownload(token: string, requestingUserId: string) {
  const grant = await prisma.download.findUnique({
    where: { token },
    include: { productFile: true },
  });

  if (!grant) throw new Error("Invalid or unknown download link");
  if (grant.userId !== requestingUserId) throw new Error("This link does not belong to your account");
  if (grant.expiresAt < new Date()) throw new Error("This download link has expired");
  if (grant.downloadCount >= grant.maxDownloads) throw new Error("Download limit reached for this link");

  const file = grant.productFile;
  let url: string;

  if (file.fileData) {
    // Stored directly in the database (no S3 configured) — serve as a data URI.
    const mime = file.mimeType || "application/octet-stream";
    url = `data:${mime};base64,${Buffer.from(file.fileData).toString("base64")}`;
  } else if (file.storageKey) {
    url = await getSignedDownloadUrl(file.storageKey, file.fileName);
  } else {
    throw new Error("This product's file is not available");
  }

  await prisma.download.update({
    where: { id: grant.id },
    data: { downloadCount: { increment: 1 } },
  });

  return { signedUrl: url, fileName: file.fileName };
}
