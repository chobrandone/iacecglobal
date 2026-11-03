'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Calendar, Search } from 'lucide-react';

type Item = { id: string; text: string; node: ReactNode; featuredNode: ReactNode };

/** Search box + list for the newsroom; cards are server-rendered and passed in. */
export function NewsSearch({
  placeholder,
  items,
  emptyTitle,
  emptyText,
  tabs,
}: {
  placeholder: string;
  items: Item[];
  emptyTitle: string;
  emptyText: string;
  tabs: ReactNode;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const results = useMemo(() => (query ? items.filter((i) => i.text.toLowerCase().includes(query)) : items), [items, query]);
  // The first result is always shown in the wide "featured" layout, as on the live site.
  const [first, ...others] = results;

  return (
    <>
      <div className="flex flex-col gap-5 border-b border-navy/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        {tabs}
        <label className="relative flex items-center sm:w-72">
          <Search className="absolute left-4 h-4 w-4 text-ink/35" aria-hidden="true" />
          <span className="sr-only">Search news</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="field-input pl-11" />
        </label>
      </div>
      <div className="mt-10">
        {first ? (
          <div className="space-y-6">
            {first.featuredNode}
            {others.length > 0 && <div className="grid gap-6 md:grid-cols-2">{others.map((o) => <div key={o.id} className="contents">{o.node}</div>)}</div>}
          </div>
        ) : (
          <EmptyState title={query ? 'No stories match your search.' : emptyTitle} text={query ? 'Try a different word, or browse the events and resources tabs.' : emptyText} />
        )}
      </div>
    </>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-navy/15 bg-white p-10 text-center sm:p-14">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mist text-navy/40">
        <Calendar className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-[1.1rem] text-navy">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[0.92rem] leading-relaxed text-ink/60">{text}</p>
    </div>
  );
}
