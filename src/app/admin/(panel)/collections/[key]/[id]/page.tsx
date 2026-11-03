import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { collectionMap } from '@/lib/collections';
import { emptyValue } from '@/lib/fields';
import { requirePage } from '@/lib/permissions';
import { ItemEditor } from './ItemEditor';

export default async function EditItem({ params }: { params: Promise<{ key: string; id: string }> }) {
  await requirePage('content');
  const { key, id } = await params;
  const def = collectionMap[key];
  if (!def) notFound();

  let values: Record<string, unknown> = emptyValue(def.fields);
  if (id !== 'new') {
    const row = await (prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> }>)[def.model].findUnique({
      where: { id },
    });
    if (!row) notFound();
    values = Object.fromEntries(
      def.fields.map((f) => {
        const v = row[f.name];
        if (v instanceof Date) return [f.name, v.toISOString().slice(0, 10)];
        return [f.name, v ?? (f.kind === 'boolean' ? false : f.kind === 'gallery' ? [] : '')];
      }),
    );
  } else {
    for (const f of def.fields) if (f.kind === 'boolean' && ['published', 'showPublic', 'showOnHome', 'showDate'].includes(f.name)) values[f.name] = true;
    if (def.fields.some((f) => f.name === 'location')) values.location = key === 'programmes' ? 'Douala, Cameroon' : values.location;
    if (key === 'programmes') values.delivery = 'By invitation or partnership';
  }

  return <ItemEditor collectionKey={key} id={id === 'new' ? null : id} initial={values} />;
}
