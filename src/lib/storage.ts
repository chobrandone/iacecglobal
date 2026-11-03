import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * File storage. With S3_BUCKET set, files go to any S3-compatible store (AWS S3, Cloudflare R2,
 * Supabase Storage); otherwise they are written to public/uploads (local development only —
 * Vercel's filesystem is read-only).
 */
const useS3 = () => !!process.env.S3_BUCKET;

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });
  return client;
}

export async function putFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (useS3()) {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${process.env.S3_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
  }
  const file = path.join(process.cwd(), 'public', 'uploads', key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return `/uploads/${key}`;
}

export async function removeFile(key: string) {
  if (key.startsWith('seed/')) return; // bundled seed images live in /public/media and are not deleted
  if (useS3()) {
    await s3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  await unlink(path.join(process.cwd(), 'public', 'uploads', key)).catch(() => undefined);
}
