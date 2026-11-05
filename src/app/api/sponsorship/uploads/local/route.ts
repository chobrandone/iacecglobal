import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MAX_FILE_BYTES } from '@/lib/sponsorship/schema';
import { saveLocal } from '@/lib/sponsorship/storage';

export const runtime = 'nodejs';

/** Development stand-in for the private bucket. Production always uploads straight to the bucket. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 });
  const form = await req.formData();
  const key = String(form.get('key') ?? '');
  const file = form.get('file');
  const session = await prisma.uploadSession.findUnique({ where: { token: String(form.get('token') ?? '') } });
  if (!session?.keys.includes(key) || !(file instanceof File) || file.size > MAX_FILE_BYTES) return new NextResponse(null, { status: 403 });
  await saveLocal(key, Buffer.from(await file.arrayBuffer()));
  return new NextResponse(null, { status: 204 });
}
