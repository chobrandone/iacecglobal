'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { reorderCollection, togglePublished } from '@/app/admin/_actions/content';
import { SortableList } from '@/components/admin/Sortable';
import { Button, Card, Input, PageTitle, Select, Switch } from '@/components/admin/ui';
import { collectionMap } from '@/lib/collections';

type Row = { id: string; title: string; subtitle: string; image: string; published?: boolean; filterValue: string };

export function CollectionList({ collectionKey, items: initial }: { collectionKey: string; items: Row[] }) {
  const def = collectionMap[collectionKey];
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const filtering = !!query || !!filter;
  const visible = items.filter(
    (i) => (!query || `${i.title} ${i.subtitle}`.toLowerCase().includes(query.toLowerCase())) && (!filter || i.filterValue === filter),
  );

  async function onReorder(next: Row[]) {
    setItems(next);
    const res = await reorderCollection(collectionKey, next.map((i) => i.id));
    if (res.ok) toast.success('Order saved');
    else toast.error(res.error);
  }

  async function onToggle(id: string, value: boolean) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, published: value } : i)));
    const res = await togglePublished(collectionKey, id, value);
    if (!res.ok) toast.error(res.error);
  }

  const row = (item: Row, handle?: React.ReactNode) => (
    <div className="flex items-center gap-3 border-b border-navy/[0.06] bg-white px-3 py-2.5 last:border-0">
      {handle}
      {def.imageField && (
        <span className="h-10 w-14 flex-none overflow-hidden rounded bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
        </span>
      )}
      <Link href={`/admin/collections/${collectionKey}/${item.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-navy hover:underline">{item.title || '(untitled)'}</span>
        {item.subtitle && <span className="block truncate text-xs text-ink/50">{item.subtitle}</span>}
      </Link>
      {def.publishedField && (
        <Switch checked={!!item.published} onChange={(v) => onToggle(item.id, v)} label={def.publishedField === 'approved' ? 'Approved' : def.publishedField === 'showPublic' ? 'Public' : 'Published'} />
      )}
    </div>
  );

  return (
    <>
      <PageTitle
        title={def.label}
        description={def.description}
        actions={
          <Link href={`/admin/collections/${collectionKey}/new`}>
            <Button>
              <Plus className="h-4 w-4" /> Add {def.singular.toLowerCase()}
            </Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="pl-9" aria-label="Search" />
        </div>
        {def.filter && (
          <Select
            value={filter}
            onChange={setFilter}
            className="sm:w-56"
            options={[{ value: '', label: `All — ${def.filter.label}` }, ...def.filter.options]}
          />
        )}
      </div>
      {def.orderField && !filtering && <p className="mb-2 text-xs text-ink/50">Drag the handles to change the order on the website.</p>}
      <Card className="overflow-hidden p-0">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">Nothing here yet.</p>
        ) : def.orderField && !filtering ? (
          <SortableList items={items} getId={(i) => i.id} onReorder={onReorder} renderItem={(item, handle) => row(item, handle)} />
        ) : (
          visible.map((item) => <div key={item.id}>{row(item)}</div>)
        )}
      </Card>
    </>
  );
}
