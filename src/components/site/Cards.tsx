import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import type { Event, Milestone, NewsArticle, Programme } from '@prisma/client';
import { cn, formatDate } from '@/lib/utils';
import { Picture } from './Picture';
import { Reveal } from './Reveal';
import { SmartLink } from './Button';

export const pillarLabels: Record<string, string> = {
  teachers: 'Teachers',
  children: 'Children',
  families: 'Families',
  care: 'Child Support',
  partnerships: 'Partnerships',
};

export function ProgrammeCard({ programme, index = 0 }: { programme: Programme; index?: number }) {
  const href = `/programmes/${programme.slug}`;
  return (
    <Reveal delay={index * 0.06} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-navy/[0.08] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="relative overflow-hidden">
          <Picture
            src={programme.coverImage}
            alt={programme.coverAlt || programme.title}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 font-heading text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-navy">
            {pillarLabels[programme.pillar] ?? 'Programme'}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-[1.12rem] leading-snug text-navy">
            <Link href={href} className="transition-colors hover:text-navy-800">
              {programme.title}
            </Link>
          </h3>
          <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-ink/65">{programme.summary}</p>
          <div className="mt-6 flex items-center justify-between border-t border-navy/[0.07] pt-4">
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 font-heading text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-navy/70 transition-colors hover:text-gold"
            >
              Learn more
            </Link>
            {programme.ctaLabel && (
              <SmartLink
                href={programme.ctaLink || '/contact'}
                className="inline-flex items-center gap-1.5 font-heading text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-gold-deep transition-colors hover:text-navy"
              >
                {programme.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </SmartLink>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function NewsCard({ post, index = 0, featured = false }: { post: NewsArticle; index?: number; featured?: boolean }) {
  const href = `/news/${post.slug}`;
  return (
    <Reveal delay={index * 0.06} className="h-full">
      <article
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-navy/[0.08] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
          featured && 'lg:flex-row',
        )}
      >
        <Link href={href} className={cn('block', featured && 'lg:w-1/2')} aria-label={post.title}>
          <Picture
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            sizes={featured ? '(min-width: 1024px) 580px, 100vw' : '(min-width: 768px) 580px, 100vw'}
            className={cn(
              'block w-full transition-transform duration-700 group-hover:scale-[1.03]',
              featured ? 'aspect-[16/10] h-full lg:aspect-auto lg:min-h-[320px]' : 'aspect-[16/10]',
            )}
          />
        </Link>
        <div className={cn('flex flex-1 flex-col p-6', featured && 'lg:w-1/2 lg:p-9')}>
          <div className="flex items-center gap-3 font-heading text-[0.62rem] uppercase tracking-[0.14em] text-navy/45">
            <span className="rounded-full bg-gold-tint px-2.5 py-1 text-gold-deep">{post.category || 'News'}</span>
            <time dateTime={post.publishedAt.toISOString()}>{post.showDate ? formatDate(post.publishedAt) : ''}</time>
          </div>
          <h3 className={cn('mt-4 leading-snug text-navy', featured ? 'text-[1.5rem] lg:text-[1.75rem]' : 'text-[1.1rem]')}>
            <Link href={href} className="transition-colors hover:text-navy-800">
              {post.title}
            </Link>
          </h3>
          <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-ink/65">{post.excerpt}</p>
          <Link
            href={href}
            className="mt-5 inline-flex items-center gap-1.5 font-heading text-[0.73rem] font-semibold uppercase tracking-[0.12em] text-navy transition-colors hover:text-gold"
          >
            Read the story
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

export function Timeline({ entries }: { entries: Milestone[] }) {
  return (
    <div className="relative">
      <span
        className="absolute bottom-4 left-[9px] top-3 w-px bg-gradient-to-b from-gold via-gold/45 to-transparent md:left-1/2"
        aria-hidden="true"
      />
      <ul className="space-y-9 sm:space-y-11">
        {entries.map((entry, i) => {
          const left = i % 2 === 0;
          return (
            <li key={entry.id} className="relative pl-10 md:grid md:grid-cols-2 md:gap-14 md:pl-0">
              <span
                className="absolute left-0 top-2 h-[19px] w-[19px] rounded-full border-2 border-gold bg-white md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              />
              <Reveal className={left ? 'md:col-start-1 md:pr-6 md:text-right' : 'md:col-start-2 md:pl-6'}>
                <span className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.16em] text-gold-deep">
                  {entry.period}
                </span>
                <h3 className="mt-2 text-[1.1rem] leading-snug text-navy">{entry.title}</h3>
                <p className="mt-2 text-[0.93rem] leading-relaxed text-ink/65">{entry.description}</p>
                {entry.era && (
                  <span className="mt-3 inline-flex rounded-full bg-mist px-3 py-1 font-heading text-[0.6rem] uppercase tracking-[0.14em] text-navy/55">
                    {entry.era}
                  </span>
                )}
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EventCard({ event, index = 0 }: { event: Event; index?: number }) {
  return (
    <Reveal delay={index * 0.06} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-navy/[0.08] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-row">
        <div className="relative sm:w-[42%]">
          {event.image ? (
            <Picture src={event.image} alt={event.title} className="block aspect-[16/10] h-full w-full sm:aspect-auto" sizes="(min-width: 768px) 260px, 100vw" />
          ) : (
            <div className="flex aspect-[16/10] h-full w-full items-center justify-center bg-mist sm:aspect-auto">
              <Calendar className="h-9 w-9 text-navy/20" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-heading text-[0.7rem] uppercase tracking-[0.12em] text-navy/50">
            <span className="inline-flex items-center gap-1.5 text-gold-deep">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(event.startsAt)}
            </span>
            {event.startTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {event.startTime}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-[1.12rem] leading-snug text-navy">{event.title}</h3>
          {event.venue && (
            <p className="mt-2 inline-flex items-start gap-1.5 text-[0.88rem] text-ink/60">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {event.venue}
            </p>
          )}
          <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-ink/65">{event.description}</p>
          {event.registrationOpen && (
            <Link
              href={`/contact?topic=${encodeURIComponent(event.title)}`}
              className="mt-5 inline-flex items-center gap-1.5 font-heading text-[0.73rem] font-semibold uppercase tracking-[0.12em] text-navy transition-colors hover:text-gold"
            >
              Register interest
            </Link>
          )}
        </div>
      </article>
    </Reveal>
  );
}
