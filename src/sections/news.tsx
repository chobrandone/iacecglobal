import Link from 'next/link';
import { ArrowLeft, Calendar, Download, FileText } from 'lucide-react';
import { getConferences, getEvents, getNewsroomArticles, getResources } from '@/lib/content';
import { cn, formatDate } from '@/lib/utils';
import { EventCard, NewsCard } from '@/components/site/Cards';
import { EmptyState, NewsSearch } from '@/components/site/NewsSearch';
import { Picture } from '@/components/site/Picture';
import { Reveal } from '@/components/site/Reveal';
import type { SectionProps } from './types';

type HubContent = {
  view: 'news' | 'events' | 'resources';
  tabs: { key: string; label: string; href: string }[];
  searchPlaceholder: string;
  newsEmptyTitle: string;
  newsEmptyText: string;
  eventsEmptyTitle: string;
  eventsEmptyText: string;
  conferencesHeading: string;
  resourcesEmptyTitle: string;
  resourcesEmptyText: string;
};

export async function NewsHub({ c }: SectionProps<HubContent>) {
  const tabs = (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Content sections">
      {c.tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          role="tab"
          aria-selected={c.view === t.key}
          className={cn(
            'rounded-full px-5 py-2.5 font-heading text-[0.78rem] font-semibold transition-colors',
            c.view === t.key ? 'bg-navy text-white' : 'bg-mist text-ink/60 hover:bg-gold-tint hover:text-navy',
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );

  let body: React.ReactNode;
  if (c.view === 'news') {
    const posts = await getNewsroomArticles();
    return (
      <section className="bg-white py-12 sm:py-14">
        <div className="container-page">
          <NewsSearch
            tabs={tabs}
            placeholder={c.searchPlaceholder}
            emptyTitle={c.newsEmptyTitle}
            emptyText={c.newsEmptyText}
            items={posts.map((p, i) => ({
              id: p.id,
              text: [p.title, p.excerpt, p.category].join(' '),
              node: <NewsCard post={p} index={Math.max(0, i - 1)} />,
              featuredNode: <NewsCard post={p} featured />,
            }))}
          />
        </div>
      </section>
    );
  } else if (c.view === 'events') {
    const [events, conferences] = await Promise.all([getEvents(), getConferences()]);
    body = (
      <div className="mt-10 space-y-12">
        {events.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState title={c.eventsEmptyTitle} text={c.eventsEmptyText} />
        )}
        {conferences.length > 0 && (
          <div>
            <h2 className="text-[1.4rem] text-navy sm:text-[1.7rem]">{c.conferencesHeading}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {conferences.map((conf, i) => {
                const gallery = (conf.gallery as { src: string; alt: string }[]) ?? [];
                return (
                  <Reveal key={conf.id} delay={i * 0.05}>
                    <article className="h-full rounded-[1.4rem] border border-navy/[0.08] bg-mist p-6">
                      <p className="font-heading text-[0.62rem] uppercase tracking-[0.16em] text-gold-deep">
                        {conf.dateLabel}
                        {conf.venue ? ` · ${conf.venue}` : ''}
                      </p>
                      <h3 className="mt-2 text-[1.05rem] text-navy">{conf.title}</h3>
                      <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{conf.summary}</p>
                      {conf.report && <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/55">{conf.report}</p>}
                      {gallery.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {gallery.slice(0, 6).map((g) => (
                            <Picture key={g.src} src={g.src} alt={g.alt} sizes="160px" className="aspect-square w-full rounded-xl" />
                          ))}
                        </div>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    const resources = await getResources();
    body = (
      <div className="mt-10">
        {resources.length ? (
          <ul className="divide-y divide-navy/[0.08] overflow-hidden rounded-[1.5rem] border border-navy/[0.08]">
            {resources.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gold-tint text-gold-deep">
                    <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-heading text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep">{r.category}</p>
                    <h3 className="mt-1 text-[1rem] text-navy">{r.title}</h3>
                    {r.description && <p className="mt-1 text-[0.9rem] leading-relaxed text-ink/60">{r.description}</p>}
                  </div>
                </div>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-none items-center gap-2 rounded-full border border-navy/20 px-4 py-2 font-heading text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-navy transition-colors hover:border-gold hover:text-gold-deep"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={c.resourcesEmptyTitle} text={c.resourcesEmptyText} />
        )}
      </div>
    );
  }

  return (
    <section className="bg-white py-12 sm:py-14">
      <div className="container-page">
        <div className="flex flex-col gap-5 border-b border-navy/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">{tabs}</div>
        {body}
      </div>
    </section>
  );
}

export function ArticleBody({ c, ctx }: SectionProps<{ backLabel: string; byline: string }>) {
  const a = ctx.article;
  if (!a) return null;
  return (
    <article>
      <div className="bg-mist">
        <div className="container-page py-12 sm:py-16">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 font-heading text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-navy/60 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {c.backLabel}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 font-heading text-[0.65rem] uppercase tracking-[0.14em] text-ink/45">
            <span className="rounded-full bg-gold-tint px-3 py-1 text-gold-deep">{a.category || 'News'}</span>
            {a.showDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={a.publishedAt.toISOString()}>{formatDate(a.publishedAt, 'long')}</time>
              </span>
            )}
            {a.author && (
              <span>
                {c.byline} {a.author}
              </span>
            )}
          </div>
          <h1 className="mt-5 max-w-3xl text-[2rem] leading-[1.12] sm:text-[2.6rem]">{a.title}</h1>
          {a.excerpt && <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink/70">{a.excerpt}</p>}
        </div>
      </div>
      {a.coverImage && (
        <div className="container-page -mt-2">
          <Reveal>
            <Picture
              src={a.coverImage}
              alt={a.coverAlt || a.title}
              priority
              sizes="(min-width: 1240px) 1160px, 100vw"
              className="aspect-[16/9] w-full rounded-[1.75rem] shadow-soft"
            />
          </Reveal>
        </div>
      )}
      <div className="container-page py-14 sm:py-16">
        <Reveal className="prose-iacec mx-auto max-w-2xl text-[1.05rem]">
          <div dangerouslySetInnerHTML={{ __html: a.body || `<p>${a.excerpt}</p>` }} />
        </Reveal>
      </div>
    </article>
  );
}

export async function MoreNews({ c, ctx }: SectionProps<{ heading: string; count: number }>) {
  const a = ctx.article;
  if (!a) return null;
  const posts = (await getNewsroomArticles()).filter((p) => p.id !== a.id).slice(0, c.count || 2);
  if (!posts.length) return null;
  return (
    <section className="bg-mist py-14 sm:py-16">
      <div className="container-page">
        <h2 className="text-[1.5rem] sm:text-[1.9rem]">{c.heading}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {posts.map((p, i) => (
            <NewsCard key={p.id} post={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
