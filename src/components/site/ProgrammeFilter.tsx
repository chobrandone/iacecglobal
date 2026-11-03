'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Client-side pillar filter. Cards are rendered on the server and passed in with their
 * pillar key, so filtering costs no extra data.
 */
export function ProgrammeFilter({
  filters,
  cards,
  emptyTitle,
  emptyText,
}: {
  filters: { key: string; label: string }[];
  cards: { pillar: string; node: ReactNode }[];
  emptyTitle: string;
  emptyText: Record<string, string>;
}) {
  const [active, setActive] = useState(filters[0]?.key ?? 'all');
  const visible = active === 'all' ? cards : cards.filter((c) => c.pillar === active);

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter programmes by pillar">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(f.key)}
            aria-pressed={active === f.key}
            className={cn(
              'rounded-full border px-4 py-2 font-heading text-[0.76rem] font-semibold transition-colors',
              active === f.key ? 'border-navy bg-navy text-white' : 'border-navy/15 text-ink/60 hover:border-navy/40 hover:text-navy',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c, i) => (
            <div key={i} className="contents">
              {c.node}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[1.5rem] border border-navy/[0.08] bg-mist p-10 text-center">
          <p className="font-heading text-[1.05rem] font-semibold text-navy">{emptyTitle}</p>
          <p className="mt-2 text-[0.92rem] text-ink/60">
            Please check another pillar, or contact us to ask about {emptyText[active] || 'this area'}.
          </p>
        </div>
      )}
    </>
  );
}
