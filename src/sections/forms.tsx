import { ArrowRight, Landmark, Mail, MapPin, MessageCircle, Phone, Smartphone, Globe } from 'lucide-react';
import { getForm, getSettings } from '@/lib/content';
import type { FormField, PublicFormDefinition } from '@/lib/forms';
import { getIcon } from '@/lib/icons';
import { cn, telHref } from '@/lib/utils';
import { ButtonLink } from '@/components/site/Button';
import { DynamicForm } from '@/components/site/DynamicForm';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeader } from '@/components/site/SectionHeader';
import { bgClass, type Header, type LinkValue, type SectionProps } from './types';

async function loadForm(key: string): Promise<PublicFormDefinition | null> {
  const def = await getForm(key);
  if (!def) return null;
  return {
    key: def.key,
    submitLabel: def.submitLabel,
    successTitle: def.successTitle,
    successBody: def.successBody,
    note: def.note,
    errorMessage: def.errorMessage,
    fields: def.fields as unknown as FormField[],
  };
}

export async function FormSection({
  c,
  bg,
  anchor,
}: SectionProps<
  Header & {
    formKey: string;
    layout: 'narrow' | 'balanced';
    compact: boolean;
    bulletStyle: 'arrow' | 'dot';
    bullets: { text: string }[];
    notes: { title: string; text: string }[];
    boxes: { icon: string; title: string; text: string; numbered: boolean }[];
    cardHeading: string;
    cardText: string;
    cardLink?: LinkValue;
  }
>) {
  const def = c.formKey ? await loadForm(c.formKey) : null;
  const hasAside = c.bullets.length > 0 || c.notes.length > 0 || c.boxes.length > 0;
  const header = <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />;
  return (
    <section id={anchor ?? undefined} className={cn('scroll-mt-24', bgClass(bg), c.compact ? 'py-16 sm:py-20' : 'py-16 sm:py-20 lg:py-24')}>
      <div
        className={cn(
          'container-page grid gap-12 lg:gap-16',
          c.layout === 'balanced' ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'lg:grid-cols-[0.85fr_1.15fr]',
        )}
      >
        {hasAside ? (
          <div>
            {header}
            {c.bullets.length > 0 &&
              (c.bulletStyle === 'dot' ? (
                <ul className="mt-8 space-y-3 text-[0.92rem] leading-relaxed text-ink/65">
                  {c.bullets.map((b) => (
                    <li key={b.text}>• {b.text}</li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-8 space-y-3 text-[0.92rem] text-ink/65">
                  {c.bullets.map((b) => (
                    <li key={b.text} className="flex gap-2.5">
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden="true" />
                      {b.text}
                    </li>
                  ))}
                </ul>
              ))}
            {c.notes.length > 0 && (
              <div className="mt-8 space-y-4 text-[0.92rem] leading-relaxed text-ink/65">
                {c.notes.map((n) => (
                  <p key={n.title}>
                    <strong className="font-heading text-[0.9rem] text-navy">{n.title}</strong> {n.text}
                  </p>
                ))}
              </div>
            )}
            {c.boxes.map((box, i) => {
              const Icon = getIcon(box.icon);
              return (
                <div key={box.title} className={cn('rounded-2xl border border-navy/[0.08] bg-white p-5', i === 0 ? 'mt-8' : 'mt-4')}>
                  <p className="flex items-center gap-2 font-heading text-[0.8rem] font-semibold text-navy">
                    <Icon className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                    {box.title}
                  </p>
                  {box.numbered ? (
                    <ol className="mt-2 space-y-1.5 text-[0.88rem] leading-relaxed text-ink/60">
                      {box.text
                        .split('\n')
                        .filter((l) => l.trim())
                        .map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                    </ol>
                  ) : (
                    <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/60">{box.text}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          header
        )}
        <div className="rounded-[1.6rem] border border-navy/[0.08] bg-white p-6 shadow-soft sm:p-8">
          {c.cardHeading ? (
            <>
              <h3 className="text-[1.15rem] text-navy">{c.cardHeading}</h3>
              {c.cardText && <p className="mt-2 text-[0.9rem] text-ink/60">{c.cardText}</p>}
              {c.cardLink?.href ? (
                <ButtonLink href={c.cardLink.href} className="mt-6">
                  {c.cardLink.label}
                </ButtonLink>
              ) : (
                <div className="mt-6">{def && <DynamicForm def={def} />}</div>
              )}
            </>
          ) : (
            def && <DynamicForm def={def} />
          )}
        </div>
      </div>
    </section>
  );
}

export async function ContactCards({
  c,
}: SectionProps<{ emailLabel: string; phoneLabel: string; whatsappLabel: string; locationLabel: string }>) {
  const s = await getSettings();
  const location = [s.addressLine, s.city, s.country].filter(Boolean).join(', ');
  const wa = s.whatsappNumber.replace(/[^\d]/g, '');
  const cards = [
    { href: `mailto:${s.email}`, Icon: Mail, label: c.emailLabel, lines: [s.email] },
    { href: telHref(s.phones[0]?.number ?? ''), Icon: Phone, label: c.phoneLabel, lines: s.phones.map((p) => p.number) },
    wa && { href: `https://wa.me/${wa}`, Icon: MessageCircle, label: c.whatsappLabel, lines: [s.whatsappNumber], external: true },
    { href: s.mapUrl, Icon: MapPin, label: c.locationLabel, lines: [location], external: true },
  ].filter(Boolean) as { href: string; Icon: typeof Mail; label: string; lines: string[]; external?: boolean }[];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-page">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Reveal key={card.label} delay={i * 0.05}>
              <a
                href={card.href}
                {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group flex h-full flex-col rounded-[1.4rem] border border-navy/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-tint text-gold-deep transition-colors group-hover:bg-gold group-hover:text-navy">
                  <card.Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-heading text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-deep">{card.label}</p>
                <div className="mt-2 space-y-1 text-[0.92rem] leading-relaxed text-ink/70">
                  {card.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function ContactMain({
  c,
}: SectionProps<{
  formKey: string;
  formHeading: string;
  formText: string;
  eyebrow: string;
  heading: string;
  text: string;
  mapLinkLabel: string;
  mapLinkAction: string;
  newsletterHeading: string;
  newsletterText: string;
}>) {
  const [def, s] = await Promise.all([loadForm(c.formKey), getSettings()]);
  return (
    <section className="bg-mist py-16 sm:py-20 lg:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="rounded-[1.6rem] border border-navy/[0.08] bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-[1.35rem] text-navy">{c.formHeading}</h2>
          <p className="mt-2 text-[0.92rem] text-ink/60">{c.formText}</p>
          <div className="mt-7">{def && <DynamicForm def={def} prefillTopic />}</div>
        </div>
        <div className="space-y-6">
          <div>
            <SectionHeader eyebrow={c.eyebrow} title={c.heading} />
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/65">{c.text}</p>
            {s.mapEmbedUrl && (
              <iframe
                src={s.mapEmbedUrl}
                title="Map"
                loading="lazy"
                className="mt-5 aspect-[4/3] w-full rounded-[1.4rem] border border-navy/[0.08]"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
            <a
              href={s.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-between gap-4 rounded-[1.4rem] border border-navy/[0.08] bg-white p-5 transition-colors hover:border-gold/40"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-navy">
                  <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="font-heading text-[0.9rem] font-semibold text-navy">{c.mapLinkLabel}</span>
              </span>
              <span className="font-heading text-[0.7rem] uppercase tracking-[0.12em] text-gold-deep">{c.mapLinkAction}</span>
            </a>
          </div>
          <div className="rounded-[1.4rem] border border-navy/[0.08] bg-white p-6">
            <h3 className="text-[1.05rem] text-navy">{c.newsletterHeading}</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/60">{c.newsletterText}</p>
            <div className="mt-4">
              <NewsletterForm tone="light" source="Contact page" placeholder={s.newsletterPlaceholder} success={s.newsletterSuccess} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function GivingMethods({
  c,
  bg,
}: SectionProps<Header & { emptyTitle: string; emptyText: string; contactLink: LinkValue }>) {
  const s = await getSettings();
  const methods = [
    s.bankDetails && { Icon: Landmark, label: 'Bank transfer', body: s.bankDetails },
    s.mobileMoneyDetails && { Icon: Smartphone, label: 'Mobile Money — MTN / Orange', body: s.mobileMoneyDetails },
    s.internationalDetails && { Icon: Globe, label: 'International giving', body: s.internationalDetails },
  ].filter(Boolean) as { Icon: typeof Landmark; label: string; body: string }[];

  return (
    <section className={cn(bgClass(bg), 'py-16 sm:py-20')}>
      <div className="container-page">
        <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.description} />
        {methods.length > 0 || s.givingNote ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {s.givingNote && (
              <Reveal className="sm:col-span-2">
                <div className="rounded-[1.4rem] border border-gold/30 bg-gold-tint/60 p-6 text-[0.95rem] leading-relaxed text-ink/75">
                  {s.givingNote}
                </div>
              </Reveal>
            )}
            {methods.map((m) => (
              <Reveal key={m.label}>
                <div className="h-full rounded-[1.4rem] border border-navy/[0.08] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-navy">
                      <m.Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h3 className="text-[1rem] text-navy">{m.label}</h3>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-[0.92rem] leading-relaxed text-ink/70">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-10">
            <div className="rounded-[1.5rem] border border-dashed border-navy/15 bg-white p-8 text-center sm:p-12">
              <h3 className="text-[1.15rem] text-navy">{c.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-lg text-[0.94rem] leading-relaxed text-ink/60">{c.emptyText}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {c.contactLink?.href && (
                  <ButtonLink href={c.contactLink.href} variant="outline" size="sm">
                    {c.contactLink.label}
                  </ButtonLink>
                )}
                <ButtonLink href={`mailto:${s.email}`} variant="quiet" size="sm" className="gap-2">
                  {s.email}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

