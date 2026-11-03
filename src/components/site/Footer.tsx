import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import type { SiteSettings } from '@/lib/settings-schema';
import { telHref } from '@/lib/utils';
import { SmartLink } from './Button';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';

export function Footer({ settings: s }: { settings: SiteSettings }) {
  const socials = [
    { url: s.facebookUrl, Icon: Facebook, label: 'Facebook' },
    { url: s.instagramUrl, Icon: Instagram, label: 'Instagram' },
    { url: s.youtubeUrl, Icon: Youtube, label: 'YouTube' },
    { url: s.linkedinUrl, Icon: Linkedin, label: 'LinkedIn' },
  ].filter((x) => x.url);
  const location = [s.addressLine, s.city, s.country].filter(Boolean).join(', ');

  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="h-[3px] w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" aria-hidden="true" />
      <div className="container-page relative py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" name={s.siteName} tagline={s.tagline} image={s.logoFooter} />
            <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-white/60">{s.footerDescription}</p>
            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-gold hover:text-gold"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
          {s.footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-light">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <SmartLink href={l.href} className="text-[0.88rem] text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h3 className="font-heading text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-light">
              {s.newsletterHeading}
            </h3>
            <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-white/60">{s.newsletterText}</p>
            <div className="mt-4 max-w-sm">
              <NewsletterForm tone="dark" source="Footer" placeholder={s.newsletterPlaceholder} success={s.newsletterSuccess} />
            </div>
          </div>
          <div className="space-y-3 text-[0.88rem] text-white/65 lg:pl-10">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden="true" />
              <span>{location}</span>
            </p>
            <p className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden="true" />
              <a href={`mailto:${s.email}`} className="hover:text-white">
                {s.email}
              </a>
            </p>
            {s.phones.map((p) => (
              <p key={p.number} className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-gold" aria-hidden="true" />
                <a href={telHref(p.number)} className="hover:text-white">
                  {p.number}
                </a>
              </p>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-[0.78rem] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {s.copyrightName}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {s.legalLinks.map((l) => (
              <SmartLink key={l.href + l.label} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </SmartLink>
            ))}
            {s.websiteLabel && <span className="hidden sm:inline">{s.websiteLabel}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppButton({ number, label }: { number: string; label: string }) {
  const digits = number.replace(/[^\d]/g, '');
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with IACEC on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#0f7a54] py-3 pl-3 pr-4 text-white shadow-[0_14px_30px_-12px_rgba(2,38,103,0.6)] transition-all duration-300 hover:bg-[#0c6647] sm:bottom-7 sm:right-7"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.06c-.24.67-1.4 1.28-1.94 1.32-.54.05-1.05.24-3.53-.73-2.99-1.18-4.86-4.26-5.01-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.05.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.29.15.49.22.56.35.07.13.07.74-.17 1.41z" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-heading text-[0.78rem] font-semibold opacity-0 transition-all duration-300 group-hover:max-w-[7rem] group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
}
