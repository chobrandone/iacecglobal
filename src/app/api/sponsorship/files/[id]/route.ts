import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can, currentUser } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { privateFileResponse } from '@/lib/sponsorship/storage';

export const runtime = 'nodejs';

/** Opens a child's document for authorised staff. Every opening is recorded. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!can(user.role, 'sponsorship')) return new NextResponse(null, { status: 403 });

  const { id } = await params;
  const doc = await prisma.applicationDocument.findUnique({ where: { id } });
  if (!doc) return new NextResponse(null, { status: 404 });

  const download = new URL(req.url).searchParams.has('download');
  await audit(user, download ? 'download' : 'view', 'document', doc.id, { applicationId: doc.applicationId, type: doc.type });
  return privateFileResponse(doc.storageKey, doc.filename, doc.mimeType, download);
}
