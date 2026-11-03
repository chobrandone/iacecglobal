import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Quote } from 'lucide-react';
import {
  getDonationFunds,
  getPartners,
  getPartnershipTypes,
  getTeam,
  getTestimonies,
  getValues,
  getVolunteerAreas,
} from '@/lib/content';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { ButtonLink, SmartLink } from '@/components/site/Button';
import { Rings } from '@/components/site/Decor';
import { Picture } from '@/components/site/Picture';
import { Reveal } from '@/components/site/Reveal';
import { Eyebrow, SectionHeader } from '@/components/site/SectionHeader';
import { bgClass, type Header, type ImageValue, type LinkValue, type SectionProps } from './types';

export function PageHero({
  c,
}: SectionProps<{ variant: 'split' | 'banner'; breadcrumb: string; eyebrow: string; heading: string; body: string; image: ImageValue }>) {
  if (c.variant === 'banner') {
    return (
      <section className="relative overflow-hidden bg-navy">
        {c.image?.src && (
          <Picture
            src={c.image.src}
            alt={c.image.alt}
            focal={c.image.focal}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
        <Rings className="-right-40 -top-40 h-[520px] w-[520px]" opacity={0.18} />
        <div className="container-page relative py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            {c.breadcrumb && (
              <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.14em] text-white/45">
                <Link href="/" className="hover:text-gold-light">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="text-white/80">{c.breadcrumb}</span>
              </nav>
            )}
            {c.eyebrow && <Eyebrow className="text-gold-light">{c.eyebrow}</Eyebrow>}
            <h1 className="mt-4 text-[2.2rem] leading-[1.08] text-white sm:text-[3rem] lg:text-[3.5rem]">{c.heading}</h1>
            {c.body && <p className="mt-6 max-w-2xl text-[1.06rem] leading-relaxed text-white/75">{c.body}</p>}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden bg-mist">
      <Rings className="-left-56 -top-72 h-[640px] w-[640px]" opacity={0.28} />
      <div className="container-page relative grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <Reveal>
          {c.breadcrumb && (
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-navy/40">
              <Link href="/" className="transition-colors hover:text-gold">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="text-navy/70">{c.breadcrumb}</span>
            </nav>
          )}
          {c.eyebrow && <Eyebrow>{c.eyebrow}</Eyebrow>}
          <h1 className="mt-4 text-[2.15rem] leading-[1.08] sm:text-[2.7rem] lg:text-[3.2rem]">{c.heading}</h1>
          {c.body && <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink/70">{c.body}</p>}
        </Reveal>
        {c.image?.src && (
          <Reveal delay={0.1} className="relative">
            <div className="absolute -inset-3 hidden rounded-[2rem] border border-gold/30 sm:block" aria-hidden="true" />
            <Picture
              src={c.image.src}
              alt={c.image.alt}
              focal={c.image.focal}
              priority
              sizes="(min-width: 1240px) 520px, (min-width: 1024px) 45vw, 100vw"
              className="aspect-[4/3] w-full rounded-[1.75rem] shadow-soft"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function StorySplit({
  c,
  bg,
}: SectionProps<{
  eyebrow: string;
  heading: string;
  paragraphs: string;
  facts: { label: string; value: string; text: string }[];
  image: ImageValue;
  calloutLabel: string;
  calloutText: string;
  calloutLink: LinkValue;
}>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} />
          <Reveal delay={0.05} className="prose-iacec mt-6 max-w-xl">
            {c.paragraphs
              .split('\n')
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </Reveal>
          {c.facts.length > 0 && (
            <Reveal delay={0.1} className="mt-8 grid gap-4 sm:grid-cols-2">
              {c.facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-navy/[0.08] bg-mist p-5">
                  <p className="font-heading text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{fact.label}</p>
                  <p className="mt-2 font-heading text-[1.6rem] font-bold leading-none text-navy">{fact.value}</p>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/60">{fact.text}</p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1} className="relative">
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1240px) 500px, (min-width: 1024px) 42vw, 100vw"
            className="aspect-[4/5] w-full rounded-[1.75rem] shadow-soft"
          />
          {(c.calloutLabel || c.calloutText) && (
            <div className="mt-5 rounded-2xl border border-gold/30 bg-gold-tint/70 p-5">
              <p className="font-heading text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{c.calloutLabel}</p>
              <p className="mt-2 font-heading text-[1.02rem] font-semibold leading-snug text-navy">{c.calloutText}</p>
              {c.calloutLink?.href && (
                <ButtonLink href={c.calloutLink.href} variant="quiet" className="mt-3 gap-2 px-0 text-[0.78rem]">
                  {c.calloutLink.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </ButtonLink>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function VisionMission({
  c,
}: SectionProps<{ visionLabel: string; visionText: string; missionLabel: string; missionText: string; strip: { label: string; text: string }[] }>) {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-page grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-navy p-8 sm:p-10">
            <Rings className="-right-24 -top-24 h-72 w-72" opacity={0.2} />
            <Eyebrow className="text-gold-light">{c.visionLabel}</Eyebrow>
            <p className="relative mt-6 font-heading text-[1.5rem] font-semibold leading-[1.35] text-white sm:text-[1.85rem]">{c.visionText}</p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-[1.75rem] border border-gold/35 bg-gold-tint/50 p-8 sm:p-10">
            <Eyebrow>{c.missionLabel}</Eyebrow>
            <p className="mt-6 text-[1.02rem] leading-relaxed text-ink/75">{c.missionText}</p>
          </div>
        </Reveal>
      </div>
      {c.strip.length > 0 && (
        <div className="container-page mt-6">
          <Reveal delay={0.12}>
            <div className="rounded-[1.5rem] border border-navy/[0.08] bg-mist p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-3">
                {c.strip.map((s) => (
                  <div key={s.label}>
                    <p className="font-heading text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{s.label}</p>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </section>
  );
}

export async function Values({ c, bg }: SectionProps<Header>) {
  const values = await getValues();
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => {
            const Icon = getIcon(v.icon);
            return (
              <Reveal key={v.id} delay={i * 0.05}>
                <div className="group h-full rounded-[1.4rem] border border-navy/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-tint text-gold-deep transition-colors group-hover:bg-gold group-hover:text-navy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[1.05rem] text-navy">{v.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{v.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export async function NumberedCards({
  c,
  bg,
}: SectionProps<
  Header & {
    variant: 'steps' | 'cards';
    source: 'inline' | 'volunteerAreas' | 'partnershipTypes';
    items: { title: string; text: string }[];
    ctaCard: { title: string; text: string; link: LinkValue };
  }
>) {
  let items = c.items;
  if (c.source === 'volunteerAreas') items = (await getVolunteerAreas()).map((a) => ({ title: a.title, text: a.description }));
  if (c.source === 'partnershipTypes') items = (await getPartnershipTypes()).map((a) => ({ title: a.title, text: a.description }));
  const steps = c.variant === 'steps';
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className={steps ? 'mt-10 grid gap-5 sm:grid-cols-3' : 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <div
                className={cn(
                  'h-full rounded-[1.4rem] border border-navy/[0.08] bg-white p-6',
                  !steps && 'transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-soft',
                )}
              >
                <span className="font-heading text-[0.72rem] font-bold tracking-[0.2em] text-gold">{String(i + 1).padStart(2, '0')}</span>
                <h3 className={steps ? 'mt-4 text-[1.05rem] text-navy' : 'mt-4 text-[1.02rem] leading-snug text-navy'}>{item.title}</h3>
                <p className={cn('mt-2 leading-relaxed text-ink/65', steps ? 'text-[0.92rem]' : 'text-[0.9rem]')}>{item.text}</p>
              </div>
            </Reveal>
          ))}
          {c.ctaCard?.title && (
            <Reveal delay={items.length * 0.06}>
              <div className="flex h-full flex-col justify-between rounded-[1.4rem] bg-navy p-6">
                <p className="font-heading text-[1.02rem] font-semibold leading-snug text-white">{c.ctaCard.title}</p>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-white/70">{c.ctaCard.text}</p>
                {c.ctaCard.link?.href && (
                  <SmartLink
                    href={c.ctaCard.link.href}
                    className="mt-5 inline-flex items-center gap-1.5 font-heading text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-gold-light hover:text-gold"
                  >
                    {c.ctaCard.link.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </SmartLink>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

export async function IconCards({
  c,
  bg,
}: SectionProps<
  Header & { variant: 'side' | 'sideLarge' | 'top'; source: 'inline' | 'donationFunds'; items: { icon: string; title: string; text: string }[] }
>) {
  let items = c.items;
  if (c.source === 'donationFunds') items = (await getDonationFunds()).map((d) => ({ icon: d.icon, title: d.title, text: d.description }));
  const pad = c.variant === 'sideLarge' ? 'py-16 sm:py-20 lg:py-24' : 'py-16 sm:py-20';
  return (
    <section className={cn(bgClass(bg), pad)}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className={cn('mt-12 grid gap-5 sm:grid-cols-2', c.variant === 'top' && 'lg:grid-cols-3')}>
          {items.map((item, i) => {
            const Icon = getIcon(item.icon);
            if (c.variant === 'top') {
              return (
                <Reveal key={item.title} delay={i * 0.05}>
                  <div className="h-full rounded-[1.4rem] border border-navy/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-soft">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-tint text-gold-deep">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-[1.02rem] leading-snug text-navy">{item.title}</h3>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{item.text}</p>
                  </div>
                </Reveal>
              );
            }
            if (c.variant === 'sideLarge') {
              return (
                <Reveal key={item.title} delay={i * 0.06}>
                  <div className="group flex h-full gap-5 rounded-[1.4rem] border border-navy/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-soft sm:p-7">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gold-tint text-gold-deep transition-colors group-hover:bg-gold group-hover:text-navy">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[1.12rem] leading-snug text-navy">{item.title}</h3>
                      <p className="mt-2 text-[0.93rem] leading-relaxed text-ink/65">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            }
            return (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="flex h-full gap-5 rounded-[1.4rem] border border-navy/[0.08] bg-white p-6 transition-all duration-300 hover:border-gold/40 hover:shadow-soft">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gold-tint text-gold-deep">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[1.05rem] leading-snug text-navy">{item.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function IconListImage({
  c,
  bg,
}: SectionProps<
  Header & {
    items: { icon: string; title: string; text: string }[];
    image: ImageValue;
    calloutLabel: string;
    calloutTitle: string;
    calloutText: string;
  }
>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <Reveal>
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
          <div className="mt-8 space-y-4">
            {c.items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <Reveal key={item.title} delay={i * 0.05}>
                  <div className="flex gap-4 rounded-2xl border border-navy/[0.08] bg-mist/70 p-5">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-gold-deep">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[1rem] leading-snug text-navy">{item.title}</h3>
                      <p className="mt-1 text-[0.9rem] leading-relaxed text-ink/65">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative lg:sticky lg:top-28">
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1240px) 560px, (min-width: 1024px) 48vw, 100vw"
            className="aspect-[4/3] w-full rounded-[1.75rem] shadow-soft"
          />
          {(c.calloutLabel || c.calloutTitle) && (
            <div className="mt-5 rounded-[1.5rem] border border-gold/30 bg-gold-tint/60 p-6">
              <p className="font-heading text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{c.calloutLabel}</p>
              <p className="mt-2 font-heading text-[1.02rem] font-semibold leading-snug text-navy">{c.calloutTitle}</p>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/65">{c.calloutText}</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function ImageTextList({ c, bg }: SectionProps<Header & { image: ImageValue; items: { title: string; text: string }[] }>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/3] w-full rounded-[1.75rem] shadow-soft"
          />
        </Reveal>
        <div>
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
          <div className="mt-8 space-y-4">
            {c.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="border-l-2 border-gold/50 pl-5">
                  <h3 className="text-[1rem] leading-snug text-navy">{item.title}</h3>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-ink/65">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StepsImage({ c, bg }: SectionProps<Header & { steps: { title: string; text: string }[]; image: ImageValue }>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
          <div className="mt-8 space-y-5">
            {c.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06} className="flex gap-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-gold/40 bg-white font-heading text-[0.72rem] font-bold text-gold-deep">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-[1rem] text-navy">{step.title}</h3>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-ink/65">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.1}>
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/3] w-full rounded-[1.75rem] shadow-soft"
          />
        </Reveal>
      </div>
    </section>
  );
}

export function Legal({ c, bg }: SectionProps<{ sections: { heading: string; body: string }[]; calloutHeading: string; calloutBody: string }>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page max-w-3xl">
        <div className="space-y-10">
          {c.sections.map((s) => (
            <Reveal key={s.heading}>
              <h2 className="text-[1.25rem] text-navy sm:text-[1.4rem]">{s.heading}</h2>
              <div className="prose-iacec mt-3" dangerouslySetInnerHTML={{ __html: s.body }} />
            </Reveal>
          ))}
        </div>
        {c.calloutHeading && (
          <Reveal className="mt-12 rounded-[1.4rem] border border-gold/30 bg-gold-tint/50 p-6">
            <h2 className="text-[1.1rem] text-navy">{c.calloutHeading}</h2>
            <div
              className="mt-2 text-[0.94rem] leading-relaxed text-ink/70 [&_a]:font-semibold [&_a]:text-navy [&_a]:underline [&_a]:decoration-gold [&_a]:underline-offset-4"
              dangerouslySetInnerHTML={{ __html: c.calloutBody }}
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function RichText({ c, bg }: SectionProps<{ eyebrow: string; heading: string; body: string }>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page max-w-3xl">
        {c.heading && <SectionHeader eyebrow={c.eyebrow} title={c.heading} />}
        <Reveal className={cn('prose-iacec', c.heading && 'mt-6')}>
          <div dangerouslySetInnerHTML={{ __html: c.body }} />
        </Reveal>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export async function Team({ c, bg }: SectionProps<Header & { groups: { key: string; label: string }[] }>) {
  const team = await getTeam();
  if (!team.length) return null;
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[1.9rem] leading-[1.12] sm:text-[2.35rem]">{c.heading}</h2>
          {c.description && <p className="mt-5 text-[1.02rem] leading-relaxed text-ink/70">{c.description}</p>}
        </Reveal>
        <div className="mt-12 space-y-12">
          {c.groups.map((g) => {
            const members = team.filter((m) => m.group === g.key);
            if (!members.length) return null;
            return (
              <div key={g.key}>
                <h3 className="font-heading text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{g.label}</h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m, i) => (
                    <Reveal key={m.id} delay={i * 0.05}>
                      <article className="flex h-full gap-4 rounded-[1.4rem] border border-navy/[0.08] bg-white p-5">
                        {m.photo ? (
                          <Picture src={m.photo} alt={m.name} sizes="64px" className="h-16 w-16 flex-none rounded-full" />
                        ) : (
                          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-navy font-heading text-[1rem] font-bold text-gold">
                            {initials(m.name)}
                          </span>
                        )}
                        <div>
                          <h4 className="text-[1rem] leading-snug text-navy">{m.name}</h4>
                          <p className="mt-0.5 text-[0.8rem] uppercase tracking-[0.1em] text-ink/45">{m.role}</p>
                          {m.bio && <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/65">{m.bio}</p>}
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export async function Testimonies({ c, bg }: SectionProps<Header>) {
  const items = await getTestimonies();
  if (!items.length) return null;
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.05}>
              <figure className="flex h-full flex-col rounded-[1.4rem] border border-navy/[0.08] bg-white p-6">
                <Quote className="h-6 w-6 text-gold" aria-hidden="true" />
                <blockquote className="mt-4 flex-1 text-[0.98rem] leading-relaxed text-ink/75">{t.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {t.photo && <Picture src={t.photo} alt={t.name} sizes="40px" className="h-10 w-10 flex-none rounded-full" />}
                  <span>
                    <span className="block font-heading text-[0.9rem] font-semibold text-navy">{t.name}</span>
                    {t.role && <span className="block text-[0.8rem] text-ink/50">{t.role}</span>}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function PartnerLogos({ c, bg }: SectionProps<Header>) {
  const partners = await getPartners();
  if (!partners.length) return null;
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((p) => {
            const inner = p.logo ? (
              <Image src={p.logo} alt={p.name} width={160} height={80} className="h-14 w-auto object-contain" />
            ) : (
              <span className="font-heading text-[0.9rem] font-semibold text-navy">{p.name}</span>
            );
            return (
              <div key={p.id} className="flex h-24 items-center justify-center rounded-[1.2rem] border border-navy/[0.08] bg-white p-4">
                {p.website ? (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" aria-label={p.name}>
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
