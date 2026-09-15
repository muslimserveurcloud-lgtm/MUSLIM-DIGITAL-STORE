import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Works with AWS S3, Backblaze B2, Cloudflare R2, or any S3-compatible
// provider — just point STORAGE_ENDPOINT at it. Configure in .env.

const client = new S3Client({
  region: process.env.STORAGE_REGION ?? "auto",
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
  },
});

const BUCKET = process.env.STORAGE_BUCKET ?? "";

/** Generates a short-lived signed URL. Never expose storageKey directly to clients. */
export async function getSignedDownloadUrl(storageKey: string, downloadFileName: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${downloadFileName}"`,
  });
  return getSignedUrl(client, command, { expiresIn: 300 }); // 5 min, on top of the Download record's own expiry
}

/** Used by the admin product upload flow to store a new digital file privately. */
export async function uploadPrivateFile(storageKey: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    Body: body,
    ContentType: contentType,
    // No ACL: public — bucket must be private by default.
  });
  await client.send(command);
}
