import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { MediaLibrary } from './MediaLibrary';

export default async function MediaPage() {
  await requirePage('media');
  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  return <MediaLibrary initial={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() }))} />;
}
