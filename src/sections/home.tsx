import { ArrowRight, ArrowUpRight, Check, MapPin, ShieldCheck } from 'lucide-react';
import { getLatestArticles, getMilestones, getPillars, getSponsorshipSteps } from '@/lib/content';
import { cn } from '@/lib/utils';
import { ButtonLink, SmartLink } from '@/components/site/Button';
import { NewsCard, Timeline } from '@/components/site/Cards';
import { Arch, Rings, Underline } from '@/components/site/Decor';
import { Picture } from '@/components/site/Picture';
import { Reveal } from '@/components/site/Reveal';
import { Eyebrow, SectionHeader } from '@/components/site/SectionHeader';
import { bgClass, type Header, type ImageValue, type LinkValue, type SectionProps, type StyledButton } from './types';

export function HomeHero({
  c,
}: SectionProps<{
  eyebrow: string;
  line1: string;
  line2: string;
  line3: string;
  body: string;
  primary: LinkValue;
  secondary: LinkValue;
  stats: { value: string; label: string }[];
  image: ImageValue;
  badge: string;
  visionLabel: string;
  visionText: string;
}>) {
  return (
    <section className="relative overflow-hidden bg-mist">
      <Rings className="-right-40 -top-80 h-[720px] w-[720px] sm:-right-24" opacity={0.22} />
      <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14 lg:py-20">
        <div>
          <Reveal>
            <Eyebrow>{c.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-[2.55rem] font-extrabold leading-[1.02] text-navy sm:text-[3.4rem] lg:text-[4rem]">
              {c.line1}
              <br />
              <span className="text-navy-800">{c.line2}</span>
              <br />
              <span className="relative inline-block">
                {c.line3}
                <Underline className="absolute -bottom-2 left-0 h-3 w-full text-gold" />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-lg text-[1.06rem] leading-relaxed text-ink/70">{c.body}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {c.primary?.href && (
                <ButtonLink href={c.primary.href} variant="primary" size="lg">
                  {c.primary.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              )}
              {c.secondary?.href && (
                <ButtonLink href={c.secondary.href} variant="outline" size="lg">
                  {c.secondary.label}
                </ButtonLink>
              )}
            </div>
          </Reveal>
          {c.stats.length > 0 && (
            <Reveal delay={0.2}>
              <dl className="mt-11 grid max-w-md grid-cols-3 gap-4 border-t border-navy/[0.09] pt-6">
                {c.stats.map((s) => (
                  <div key={s.label}>
                    <dt className="font-heading text-[1.35rem] font-bold leading-none text-navy">{s.value}</dt>
                    <dd className="mt-2 text-[0.74rem] uppercase leading-tight tracking-[0.1em] text-ink/45">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1} className="relative">
          <div className="relative">
            <div className="absolute -inset-2 rounded-[2.2rem] border border-gold/35 sm:-inset-3" aria-hidden="true" />
            <Picture
              src={c.image?.src}
              alt={c.image?.alt ?? ''}
              focal={c.image?.focal}
              priority
              sizes="(min-width: 1240px) 535px, (min-width: 1024px) 45vw, 100vw"
              className="aspect-[4/5] w-full rounded-[1.9rem] shadow-lift"
            />
            {(c.visionLabel || c.visionText) && (
              <div className="absolute -bottom-6 left-3 right-3 rounded-2xl border border-navy/[0.06] bg-white/95 p-5 shadow-soft backdrop-blur sm:-bottom-8 sm:left-6 sm:right-auto sm:max-w-[19rem]">
                <p className="font-heading text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{c.visionLabel}</p>
                <p className="mt-2 font-heading text-[0.98rem] font-semibold leading-snug text-navy">{c.visionText}</p>
              </div>
            )}
            {c.badge && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-navy/90 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-white backdrop-blur sm:right-5 sm:top-5">
                <MapPin className="h-3 w-3 text-gold" aria-hidden="true" />
                {c.badge}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Scripture({ c }: SectionProps<{ eyebrow: string; quote: string; reference: string }>) {
  return (
    <section className="overflow-hidden border-y border-navy/[0.07] bg-white">
      <div className="container-page relative py-14 sm:py-16">
        <Arch className="pointer-events-none absolute left-1/2 top-0 h-24 w-[420px] -translate-x-1/2 opacity-40" />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">{c.eyebrow}</span>
          <blockquote className="mt-5">
            <p className="font-heading text-[1.25rem] font-medium leading-[1.55] text-navy sm:text-[1.55rem]">{c.quote}</p>
            <footer className="mt-4 font-body text-[0.78rem] uppercase tracking-[0.18em] text-gold-deep">{c.reference}</footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutIntro({
  c,
}: SectionProps<{
  image: ImageValue;
  badgeLabel: string;
  badgeText: string;
  eyebrow: string;
  heading: string;
  paragraphs: string;
  cards: { title: string; text: string }[];
  link: LinkValue;
}>) {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="relative order-2 lg:order-1">
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1240px) 493px, (min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full rounded-[1.75rem] shadow-soft"
          />
          {(c.badgeLabel || c.badgeText) && (
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl bg-gold px-6 py-5 text-navy shadow-lift sm:block">
              <p className="font-heading text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-navy/70">{c.badgeLabel}</p>
              <p className="mt-1 font-heading text-[1rem] font-bold">{c.badgeText}</p>
            </div>
          )}
        </Reveal>
        <div className="order-1 lg:order-2">
          <Reveal>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[1.9rem] leading-[1.12] sm:text-[2.35rem] lg:text-[2.7rem]">{c.heading}</h2>
          </Reveal>
          <Reveal delay={0.05} className="prose-iacec mt-6 max-w-xl">
            {c.paragraphs
              .split('\n')
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </Reveal>
          {c.cards.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {c.cards.map((card, i) => (
                <Reveal key={card.title} delay={0.1 + i * 0.05}>
                  <div className="h-full rounded-2xl border border-navy/[0.08] bg-mist/70 p-5">
                    <p className="font-heading text-[0.78rem] font-bold uppercase tracking-[0.14em] text-gold-deep">{card.title}</p>
                    <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/65">{card.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          {c.link?.href && (
            <Reveal delay={0.2} className="mt-8">
              <ButtonLink href={c.link.href} variant="quiet" className="gap-2 px-0">
                {c.link.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

export async function Pillars({ c, bg }: SectionProps<Header & { variant: 'grid' | 'list' }>) {
  const pillars = await getPillars();
  if (c.variant === 'list') {
    return (
      <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
        <div className="container-page">
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
          <div className="mt-10 divide-y divide-navy/[0.08]">
            {pillars.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <SmartLink
                  href={p.link}
                  className="flex w-full items-center justify-between gap-6 rounded-none px-6 py-5 text-left font-body text-sm font-semibold normal-case tracking-normal text-navy transition-all duration-300 hover:text-gold"
                >
                  <span className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                    <span className="font-heading text-[0.7rem] font-bold tracking-[0.18em] text-gold">{p.number}</span>
                    <span className="font-heading text-[1.05rem] font-semibold text-navy">{p.title}</span>
                    <span className="text-[0.9rem] text-ink/55 sm:ml-auto sm:max-w-sm sm:text-right">{p.short}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-gold" aria-hidden="true" />
                </SmartLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06} className="h-full">
              <SmartLink
                href={p.link}
                className="group flex h-full flex-col justify-between rounded-[1.4rem] border border-navy/[0.09] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-heading text-[0.72rem] font-bold tracking-[0.2em] text-gold">{p.number}</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-navy/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-6 text-[1.12rem] leading-snug text-navy">{p.title}</h3>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-ink/65">{p.short}</p>
                </div>
              </SmartLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NavyFeature({
  c,
}: SectionProps<{
  variant: 'home' | 'formats' | 'shield';
  eyebrow: string;
  heading: string;
  body: string;
  items: { title: string; text: string }[];
  buttons: StyledButton[];
  image: ImageValue;
  overlayLabel: string;
  overlayText: string;
}>) {
  if (c.variant === 'formats') {
    return (
      <section className="relative overflow-hidden bg-navy py-16 sm:py-20">
        <Rings className="-right-48 -top-40 h-[540px] w-[540px]" opacity={0.16} />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow className="text-gold-light">{c.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[1.9rem] leading-[1.14] text-white sm:text-[2.35rem]">{c.heading}</h2>
            <p className="mt-5 text-[1.02rem] leading-relaxed text-white/70">{c.body}</p>
            <div className="mt-8 space-y-4">
              {c.items.map((item) => (
                <div key={item.title} className="flex items-start gap-4 border-b border-white/10 pb-4 last:border-0">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gold" aria-hidden="true" />
                  <div>
                    <p className="font-heading text-[0.92rem] font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-[0.88rem] text-white/60">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Picture
              src={c.image?.src}
              alt={c.image?.alt ?? ''}
              focal={c.image?.focal}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[4/5] w-full rounded-[1.75rem] shadow-lift"
            />
          </Reveal>
        </div>
      </section>
    );
  }
  if (c.variant === 'shield') {
    return (
      <section className="relative overflow-hidden bg-navy py-16 sm:py-20">
        <Rings className="-left-40 bottom-0 h-[520px] w-[520px]" opacity={0.15} />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <Eyebrow className="text-gold-light">{c.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[1.9rem] leading-[1.14] text-white sm:text-[2.35rem]">{c.heading}</h2>
            <p className="mt-5 text-[1.02rem] leading-relaxed text-white/70">{c.body}</p>
            <ul className="mt-7 space-y-3 text-[0.94rem] text-white/70">
              {c.items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden="true" />
                  {item.title}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <Picture
              src={c.image?.src}
              alt={c.image?.alt ?? ''}
              focal={c.image?.focal}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="aspect-[4/3] w-full rounded-[1.75rem] shadow-lift"
            />
          </Reveal>
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden bg-navy py-16 sm:py-20 lg:py-24">
      <Rings className="-left-56 bottom-0 h-[600px] w-[600px]" opacity={0.14} />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow className="text-gold-light">{c.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[1.9rem] leading-[1.12] text-white sm:text-[2.35rem] lg:text-[2.7rem]">{c.heading}</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-white/70">{c.body}</p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {c.items.map((item, i) => (
              <Reveal as="li" key={item.title} delay={0.1 + i * 0.06} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold/15">
                  <Check className="h-3 w-3 text-gold-light" aria-hidden="true" />
                </span>
                <span className="text-[0.95rem] leading-relaxed text-white/70">{item.title}</span>
              </Reveal>
            ))}
          </ul>
          {c.buttons.length > 0 && (
            <Reveal delay={0.3}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {c.buttons.map((b, i) => (
                  <ButtonLink key={b.href + b.label} href={b.href} variant={b.style}>
                    {b.label}
                    {i === 0 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </ButtonLink>
                ))}
              </div>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1} className="relative">
          <Picture
            src={c.image?.src}
            alt={c.image?.alt ?? ''}
            focal={c.image?.focal}
            sizes="(min-width: 1240px) 548px, (min-width: 1024px) 45vw, 100vw"
            className="aspect-[4/3] w-full rounded-[1.75rem] shadow-lift"
          />
          {(c.overlayLabel || c.overlayText) && (
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl bg-white p-5 shadow-lift sm:left-6 sm:right-auto sm:max-w-[18rem]">
              <p className="font-heading text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{c.overlayLabel}</p>
              <p className="mt-1.5 text-[0.92rem] leading-snug text-navy">{c.overlayText}</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}


export function ImageLinkCards({
  c,
  bg,
}: SectionProps<Header & { cards: { title: string; text: string; href: string; image: ImageValue }[] }>) {
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {c.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <SmartLink href={card.href} className="group relative block overflow-hidden rounded-[1.6rem]">
                <Picture
                  src={card.image?.src}
                  alt={card.image?.alt ?? ''}
                  focal={card.image?.focal}
                  sizes="(min-width: 768px) 568px, 100vw"
                  className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-[1.35rem] text-white sm:text-[1.55rem]">{card.title}</h3>
                      <p className="mt-2 max-w-sm text-[0.92rem] leading-relaxed text-white/75">{card.text}</p>
                    </div>
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/30 text-white transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-navy">
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </SmartLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function Sponsorship({
  c,
  bg,
  anchor,
}: SectionProps<
  Header & { image: ImageValue; statsLabel: string; stats: { value: string; label: string }[]; buttons: StyledButton[] }
>) {
  const steps = await getSponsorshipSteps();
  return (
    <section id={anchor ?? undefined} className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <Reveal className="relative">
            <Picture
              src={c.image?.src}
              alt={c.image?.alt ?? ''}
              focal={c.image?.focal}
              sizes="(min-width: 1240px) 524px, (min-width: 1024px) 45vw, 100vw"
              className="aspect-[4/5] w-full rounded-[1.75rem] shadow-soft sm:aspect-[4/3] lg:aspect-[4/5]"
            />
            {c.stats.length > 0 && (
              <div className="mt-5 rounded-2xl border border-gold/30 bg-white p-5">
                <p className="font-heading text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">{c.statsLabel}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                  {c.stats.map((s) => (
                    <div key={s.label} className="rounded-xl bg-mist px-3 py-2.5">
                      <p className="font-heading text-[1.15rem] font-bold leading-none text-navy">{s.value}</p>
                      <p className="mt-1 text-[0.72rem] uppercase tracking-[0.08em] text-ink/55">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
          <div>
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <Reveal as="li" key={step.id} delay={i * 0.05} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-gold/40 bg-white font-heading text-[0.72rem] font-bold text-gold-deep">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-[1rem] leading-snug text-navy">{step.title}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-ink/65">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            {c.buttons.length > 0 && (
              <Reveal delay={0.3} className="mt-9 flex flex-col gap-3 sm:flex-row">
                {c.buttons.map((b, i) => (
                  <ButtonLink key={b.href + b.label} href={b.href} variant={b.style}>
                    {b.label}
                    {i === 0 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </ButtonLink>
                ))}
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export async function TimelineSection({
  c,
  bg,
}: SectionProps<Header & { button: LinkValue; homeOnly: boolean; limit: number }>) {
  let entries = await getMilestones();
  if (c.homeOnly) entries = entries.filter((e) => e.showOnHome);
  if (c.limit > 0) entries = entries.slice(0, c.limit);
  if (!entries.length) return null;
  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20 lg:py-24')}>
      <div className="container-page">
        {c.button?.href ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
            <ButtonLink href={c.button.href} variant="outline" className="flex-none">
              {c.button.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        ) : (
          <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        )}
        <div className="mt-12">
          <Timeline entries={entries} />
        </div>
      </div>
    </section>
  );
}

export async function LatestNews({ c, bg }: SectionProps<Header & { button: LinkValue; count: number }>) {
  const posts = await getLatestArticles(c.count || 2);
  if (!posts.length) return null;
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
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {posts.map((post, i) => (
            <NewsCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({
  c,
}: SectionProps<{ eyebrow: string; heading: string; body: string; primary: LinkValue; secondary: LinkValue }>) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <Rings className="-right-52 -top-56 h-[620px] w-[620px]" opacity={0.16} />
      <div className="container-page relative py-16 sm:py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center text-gold-light">{c.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[1.9rem] leading-[1.14] text-white sm:text-[2.5rem]">{c.heading}</h2>
          {c.body && <p className="mt-5 text-[1.02rem] leading-relaxed text-white/70">{c.body}</p>}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {c.primary?.href && (
              <ButtonLink href={c.primary.href} variant="gold" size="lg">
                {c.primary.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            )}
            {c.secondary?.href && (
              <ButtonLink href={c.secondary.href} variant="ghostLight" size="lg">
                {c.secondary.label}
              </ButtonLink>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

