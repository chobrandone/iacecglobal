import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientFingerprint } from '@/lib/client-fingerprint';
import { prisma } from '@/lib/db';
import { DAY, hit } from '@/lib/rate-limit';
import { MAX_FILE_BYTES } from '@/lib/sponsorship/schema';
import { ALLOWED_TYPES, createUploadTarget, privateStorageReady } from '@/lib/sponsorship/storage';

export const runtime = 'nodejs';

const SESSION_DAYS = 8; // the browser draft lasts 7
const MAX_FILES_PER_SESSION = 40;
const MAX_SESSIONS_PER_WINDOW = 20;
const MAX_SESSIONS_PER_DAY = 100; // across the whole site, so faked addresses cannot fill the bucket
const WINDOW_MS = 10 * 60 * 1000;

const input = z.object({
  token: z.string().max(64).optional(),
  mimeType: z.string().max(100),
  size: z.number().int().positive(),
});

/** Issues a one-file upload to private storage for the public registration form. */
export async function POST(req: Request) {
  if (!privateStorageReady()) return NextResponse.json({ error: 'File uploads are not available right now. Please try again later.' }, { status: 503 });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'This file could not be uploaded.' }, { status: 400 });
  const { token, mimeType, size } = parsed.data;
  const ext = ALLOWED_TYPES[mimeType];
  if (!ext) return NextResponse.json({ error: 'Please choose a photo or a PDF.' }, { status: 415 });
  if (size > MAX_FILE_BYTES) return NextResponse.json({ error: 'Each file can be up to 10 MB.' }, { status: 413 });

  const { ipHash } = await clientFingerprint();
  let session = token ? await prisma.uploadSession.findUnique({ where: { token } }) : null;
  if (session && session.expiresAt < new Date()) session = null;
  if (!session) {
    const recent = await prisma.uploadSession.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } } });
    if (recent >= MAX_SESSIONS_PER_WINDOW || !(await hit('upload:sessions-day', MAX_SESSIONS_PER_DAY, DAY))) {
      return NextResponse.json({ error: 'Too many uploads from your connection. Please wait a few minutes.' }, { status: 429 });
    }
    session = await prisma.uploadSession.create({
      data: { token: randomBytes(24).toString('hex'), ipHash, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) },
    });
  }
  if (session.keys.length >= MAX_FILES_PER_SESSION) return NextResponse.json({ error: 'Too many files on this form.' }, { status: 429 });

  const key = `pending/${session.token}/${randomBytes(8).toString('hex')}.${ext}`;
  await prisma.uploadSession.update({ where: { id: session.id }, data: { keys: { push: key } } });
  return NextResponse.json({ token: session.token, key, ...(await createUploadTarget(key, mimeType, session.token)) });
}
