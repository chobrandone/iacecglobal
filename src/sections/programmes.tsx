import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getProgrammes } from '@/lib/content';
import { cn } from '@/lib/utils';
import { ButtonLink } from '@/components/site/Button';
import { ProgrammeCard, pillarLabels } from '@/components/site/Cards';
import { ProgrammeFilter } from '@/components/site/ProgrammeFilter';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeader } from '@/components/site/SectionHeader';
import { bgClass, type Header, type LinkValue, type SectionProps } from './types';

export async function Programmes({
  c,
  bg,
}: SectionProps<
  Header & {
    variant: 'featured' | 'all';
    button: LinkValue;
    count: number;
    filters: { key: string; label: string }[];
    emptyTitle: string;
  }
>) {
  const programmes = await getProgrammes();

  if (c.variant === 'all') {
    return (
      <section className={cn(bgClass(bg), 'py-14 sm:py-16 lg:py-20')}>
        <div className="container-page">
          <ProgrammeFilter
            filters={c.filters.length ? c.filters : [{ key: 'all', label: 'All programmes' }]}
            emptyTitle={c.emptyTitle || 'Nothing listed here yet.'}
            emptyText={pillarLabels}
            cards={programmes.map((p, i) => ({ pillar: p.pillar, node: <ProgrammeCard programme={p} index={i} /> }))}
          />
        </div>
      </section>
    );
  }

  const featured = programmes.filter((p) => p.featured);
  const list = (featured.length ? featured : programmes).slice(0, c.count || 3);
  if (!list.length) return null;
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
          {c.button?.href && (
            <ButtonLink href={c.button.href} variant="outline" className="flex-none">
              {c.button.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          )}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <ProgrammeCard key={p.id} programme={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProgrammeBody({
  c,
  ctx,
}: SectionProps<{
  ctaFallback: string;
  allLabel: string;
  glanceHeading: string;
  pillarLabel: string;
  whereLabel: string;
  deliveryLabel: string;
  audienceLabel: string;
  formatLabel: string;
  frequencyLabel: string;
  statusLabel: string;
  glanceNote: string;
  requestButton: LinkValue;
}>) {
  const p = ctx.programme;
  if (!p) return null;
  const rows = [
    { label: c.pillarLabel, value: pillarLabels[p.pillar] ?? '—' },
    { label: c.audienceLabel, value: p.audience },
    { label: c.formatLabel, value: p.format },
    { label: c.frequencyLabel, value: p.frequency },
    { label: c.whereLabel, value: p.location },
    { label: c.statusLabel, value: p.status },
    { label: c.deliveryLabel, value: p.delivery },
  ].filter((r) => r.label && r.value);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-page grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <Reveal className="prose-iacec max-w-2xl">
            <div dangerouslySetInnerHTML={{ __html: p.description || `<p>${p.summary}</p>` }} />
          </Reveal>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={p.ctaLink || '/contact'} variant="primary">
              {p.ctaLabel || c.ctaFallback}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/programmes" variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {c.allLabel}
            </ButtonLink>
          </div>
        </div>
        <Reveal delay={0.08}>
          <div className="rounded-[1.5rem] border border-navy/[0.08] bg-mist p-6 sm:p-7">
            <h2 className="text-[1.05rem] text-navy">{c.glanceHeading}</h2>
            <dl className="mt-4 space-y-3 text-[0.9rem]">
              {rows.map((r, i) => (
                <div key={r.label} className={cn('flex justify-between gap-4', i < rows.length - 1 && 'border-b border-navy/[0.07] pb-3')}>
                  <dt className="text-ink/50">{r.label}</dt>
                  <dd className={cn('font-semibold text-navy', i === rows.length - 1 && 'text-right')}>{r.value}</dd>
                </div>
              ))}
            </dl>
            {c.glanceNote && <p className="mt-5 text-[0.85rem] leading-relaxed text-ink/55">{c.glanceNote}</p>}
            {c.requestButton?.href && (
              <ButtonLink href={c.requestButton.href} variant="outline" size="sm" className="mt-5 w-full">
                {c.requestButton.label}
              </ButtonLink>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export async function RelatedProgrammes({ c, ctx }: SectionProps<{ eyebrow: string; heading: string; viewAllLabel: string }>) {
  const p = ctx.programme;
  if (!p) return null;
  const all = (await getProgrammes()).slice(0, 12).filter((x) => x.id !== p.id);
  const same = all.filter((x) => x.pillar === p.pillar).slice(0, 3);
  const list = same.length ? same : all.slice(0, 3);
  if (!list.length) return null;
  return (
    <section className="bg-mist py-16 sm:py-20">
      <div className="container-page">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-3 text-[1.6rem] sm:text-[2rem]">{c.heading}</h2>
          </div>
          <Link
            href="/programmes"
            className="hidden font-heading text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-navy hover:text-gold sm:inline-flex"
          >
            {c.viewAllLabel}
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x, i) => (
            <ProgrammeCard key={x.id} programme={x} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
