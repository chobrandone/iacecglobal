import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { logActivity, requireCapability } from '@/lib/permissions';
import { putFile, removeFile } from '@/lib/storage';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']);
const MAX_WIDTH = 2400;

/** Upload a file to the media library. With `replaceId`, the new file replaces an existing one everywhere it is used. */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireCapability('media');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const replaceId = form.get('replaceId')?.toString() || null;
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Please upload a JPG, PNG, WebP, GIF, AVIF or PDF file.' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Files must be 10 MB or smaller.' }, { status: 413 });

  let body: Buffer = Buffer.from(await file.arrayBuffer());
  let mimeType = file.type;
  let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  let width: number | undefined;
  let height: number | undefined;

  // Images are resized and converted to WebP to keep pages light on mobile connections.
  if (file.type.startsWith('image/') && file.type !== 'image/gif') {
    try {
      const out = await sharp(body).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      body = out.data;
      width = out.info.width;
      height = out.info.height;
      mimeType = 'image/webp';
      ext = 'webp';
    } catch {
      return NextResponse.json({ error: 'This image could not be read.' }, { status: 422 });
    }
  } else if (file.type === 'image/gif') {
    const meta = await sharp(body).metadata().catch(() => null);
    width = meta?.width;
    height = meta?.height;
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file';
  const now = new Date();
  const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${base}-${randomBytes(4).toString('hex')}.${ext}`;

  try {
    const url = await putFile(key, body, mimeType);
    if (replaceId) {
      const old = await prisma.media.findUniqueOrThrow({ where: { id: replaceId } });
      const media = await prisma.media.update({
        where: { id: replaceId },
        data: { url, key, filename: file.name, mimeType, size: body.length, width, height },
      });
      await replaceReferences(old.url, url);
      await removeFile(old.key);
      await logActivity(user.id, 'replaced', 'media', media.id, file.name);
      revalidatePath('/', 'layout');
      return NextResponse.json(media);
    }
    const media = await prisma.media.create({
      data: { url, key, filename: file.name, mimeType, size: body.length, width, height, alt: '' },
    });
    await logActivity(user.id, 'uploaded', 'media', media.id, file.name);
    return NextResponse.json(media);
  } catch (e) {
    console.error('[media] upload failed', e);
    return NextResponse.json({ error: 'The file could not be stored. Check the storage settings.' }, { status: 500 });
  }
}

/** Points every use of an image (page sections, settings, collection columns) at its replacement. */
async function replaceReferences(oldUrl: string, newUrl: string) {
  const oldJson = JSON.stringify(oldUrl).slice(1, -1);
  const newJson = JSON.stringify(newUrl).slice(1, -1);
  await prisma.$executeRaw`UPDATE "Section" SET content = replace(content::text, ${oldJson}, ${newJson})::jsonb WHERE content::text LIKE ${'%' + oldJson + '%'}`;
  await prisma.$executeRaw`UPDATE "SiteSettings" SET data = replace(data::text, ${oldJson}, ${newJson})::jsonb WHERE data::text LIKE ${'%' + oldJson + '%'}`;
  await prisma.$executeRaw`UPDATE "Programme" SET gallery = replace(gallery::text, ${oldJson}, ${newJson})::jsonb WHERE gallery::text LIKE ${'%' + oldJson + '%'}`;
  await prisma.$executeRaw`UPDATE "Conference" SET gallery = replace(gallery::text, ${oldJson}, ${newJson})::jsonb WHERE gallery::text LIKE ${'%' + oldJson + '%'}`;
  await prisma.$transaction([
    prisma.programme.updateMany({ where: { coverImage: oldUrl }, data: { coverImage: newUrl } }),
    prisma.newsArticle.updateMany({ where: { coverImage: oldUrl }, data: { coverImage: newUrl } }),
    prisma.event.updateMany({ where: { image: oldUrl }, data: { image: newUrl } }),
    prisma.milestone.updateMany({ where: { image: oldUrl }, data: { image: newUrl } }),
    prisma.teamMember.updateMany({ where: { photo: oldUrl }, data: { photo: newUrl } }),
    prisma.partner.updateMany({ where: { logo: oldUrl }, data: { logo: newUrl } }),
    prisma.testimony.updateMany({ where: { photo: oldUrl }, data: { photo: newUrl } }),
    prisma.resource.updateMany({ where: { fileUrl: oldUrl }, data: { fileUrl: newUrl } }),
    prisma.page.updateMany({ where: { ogImage: oldUrl }, data: { ogImage: newUrl } }),
  ]);
}
