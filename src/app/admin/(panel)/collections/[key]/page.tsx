import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { collectionMap } from '@/lib/collections';
import { requirePage } from '@/lib/permissions';
import { CollectionList } from './CollectionList';

export default async function CollectionPage({ params }: { params: Promise<{ key: string }> }) {
  await requirePage('content');
  const { key } = await params;
  const def = collectionMap[key];
  if (!def) notFound();
  const orderBy = def.orderField
    ? { [def.orderField]: 'asc' }
    : def.defaultSort
      ? { [def.defaultSort.field]: def.defaultSort.dir }
      : { id: 'asc' };
  const rows = await (prisma as unknown as Record<string, { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }>)[def.model].findMany({ orderBy });
  return (
    <CollectionList
      collectionKey={key}
      items={rows.map((r) => ({
        id: String(r.id),
        title: String(r[def.titleField] ?? ''),
        subtitle: def.subtitleField ? String(r[def.subtitleField] ?? '') : '',
        image: def.imageField ? ((r[def.imageField] as string) ?? '') : '',
        published: def.publishedField ? (r[def.publishedField] as boolean) : undefined,
        filterValue: def.filter ? String(r[def.filter.field] ?? '') : '',
      }))}
    />
  );
}
