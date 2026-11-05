import { mkdir, open, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MAX_FILE_BYTES } from './schema';

/**
 * Storage for child documents. These never go in the public media bucket: production uses the
 * private bucket S3_PRIVATE_BUCKET; development uses .private-uploads, outside /public.
 */
const bucket = () => process.env.S3_PRIVATE_BUCKET;
const localRoot = () => path.join(process.cwd(), '.private-uploads');

export const privateStorageReady = () => !!bucket() || process.env.NODE_ENV !== 'production';

export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

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

/** Where the browser sends the file. Going direct to the bucket avoids the host's request size limit. */
export async function createUploadTarget(key: string, mimeType: string, token: string): Promise<{ url: string; fields: Record<string, string> }> {
  if (!bucket()) return { url: '/api/sponsorship/uploads/local', fields: { key, token } };
  return createPresignedPost(s3(), {
    Bucket: bucket()!,
    Key: key,
    Expires: 600,
    Fields: { 'Content-Type': mimeType },
    Conditions: [
      ['content-length-range', 1, MAX_FILE_BYTES],
      ['eq', '$Content-Type', mimeType],
    ],
  });
}

export async function saveLocal(key: string, body: Buffer) {
  const file = path.join(localRoot(), key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

const LINK_SECONDS = 300;

/** Sends authorised staff to a link that expires in minutes. Files are never served from a public address. */
export async function privateFileResponse(key: string, filename: string, mimeType: string, download: boolean) {
  const safeName = filename.replace(/[^\w.\- ]/g, '_');
  const disposition = `${download ? 'attachment' : 'inline'}; filename="${safeName}"`;
  if (bucket()) {
    const url = await getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: disposition, ResponseContentType: mimeType }), { expiresIn: LINK_SECONDS });
    return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } });
  }
  const body = await readFile(path.join(localRoot(), key)).catch(() => null);
  if (!body) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': mimeType, 'Content-Disposition': disposition, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function readPrivate(key: string) {
  if (bucket()) {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  return readFile(path.join(localRoot(), key));
}

export async function removePrivate(key: string) {
  if (bucket()) await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  else await unlink(path.join(localRoot(), key)).catch(() => undefined);
}

/** The stored size and first bytes of a file, for checking what it really is. */
async function inspect(key: string): Promise<{ size: number; head: Buffer } | null> {
  try {
    if (bucket()) {
      const { ContentLength } = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
      const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key, Range: 'bytes=0-15' }));
      return { size: ContentLength ?? 0, head: Buffer.from(await res.Body!.transformToByteArray()) };
    }
    const file = path.join(localRoot(), key);
    const { size } = await stat(file);
    const handle = await open(file, 'r');
    const head = Buffer.alloc(16);
    await handle.read(head, 0, 16, 0);
    await handle.close();
    return { size, head };
  } catch {
    return null;
  }
}

function sniff(head: Buffer) {
  if (head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'image/png';
  if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (head.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return null;
}

/** Confirms an upload exists, is within the size limit and is really an image or PDF, whatever its name says. */
export async function verifyUpload(key: string): Promise<{ size: number; mimeType: string } | null> {
  const found = await inspect(key);
  if (!found || found.size < 1 || found.size > MAX_FILE_BYTES) return null;
  const mimeType = sniff(found.head);
  return mimeType ? { size: found.size, mimeType } : null;
}
