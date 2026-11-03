'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import type { SiteSettings } from '@/lib/settings-schema';
import { cn, telHref } from '@/lib/utils';
import { buttonClass } from './Button';
import { Logo } from './Logo';

type HeaderSettings = Pick<
  SiteSettings,
  | 'siteName'
  | 'tagline'
  | 'logo'
  | 'email'
  | 'phones'
  | 'city'
  | 'country'
  | 'nav'
  | 'getInvolvedLabel'
  | 'getInvolved'
  | 'mobileNav'
  | 'mobileGetInvolvedHeading'
  | 'contactButton'
  | 'donateButton'
  | 'mobileContactButton'
  | 'announcementEnabled'
  | 'announcementText'
  | 'announcementLink'
>;

export function Header({ settings: s }: { settings: HeaderSettings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const location = [s.city, s.country].filter(Boolean).join(', ');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDropOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
  const navClass = (href: string) =>
    cn(
      'relative py-2 font-heading text-[0.82rem] font-semibold tracking-[0.01em] transition-colors',
      isActive(href) ? 'text-navy' : 'text-ink/70 hover:text-navy',
    );

  return (
    <>
      {s.announcementEnabled && s.announcementText && (
        <div className="bg-gold text-navy">
          <div className="container-page py-2 text-center font-heading text-[0.78rem] font-semibold">
            {s.announcementText}
            {s.announcementLink?.href && (
              <Link href={s.announcementLink.href} className="ml-2 underline underline-offset-4">
                {s.announcementLink.label || 'Learn more'}
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="hidden bg-navy text-white/75 lg:block">
        <div className="container-page flex items-center justify-between py-2 text-[0.76rem]">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              {location}
            </span>
            <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 hover:text-gold-light">
              <Mail className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              {s.email}
            </a>
          </div>
          <div className="flex items-center gap-6">
            {s.phones.map((p) => (
              <a key={p.number} href={telHref(p.number)} className="inline-flex items-center gap-1.5 hover:text-gold-light">
                <Phone className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                {p.number}
              </a>
            ))}
          </div>
        </div>
      </div>
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-all duration-300',
          scrolled ? 'border-navy/[0.09] shadow-[0_10px_30px_-24px_rgba(2,38,103,0.5)]' : 'border-transparent',
        )}
      >
        <div className="container-page flex items-center justify-between gap-6">
          <Link href="/" aria-label={`${s.siteName} home`} className={cn('py-3 transition-all duration-300', scrolled && 'scale-[0.96]')}>
            <Logo name={s.siteName} tagline={s.tagline} image={s.logo} />
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {s.nav.map((item) => (
              <Link key={item.href + item.label} href={item.href} className={navClass(item.href)}>
                {item.label}
              </Link>
            ))}
            {s.getInvolved.length > 0 && (
              <div className="relative" ref={dropRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropOpen}
                  onClick={() => setDropOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 py-2 font-heading text-[0.82rem] font-semibold text-ink/70 transition-colors hover:text-navy"
                >
                  {s.getInvolvedLabel}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                {dropOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 w-64 min-w-[8rem] overflow-hidden rounded-2xl border border-navy/10 bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                  >
                    {s.getInvolved.map((item) => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setDropOpen(false)}
                        className="relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 font-body text-[0.9rem] text-ink/75 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {s.contactButton?.href && (
              <Link href={s.contactButton.href} className={buttonClass('outline', 'sm', 'hidden sm:inline-flex lg:flex')}>
                {s.contactButton.label}
              </Link>
            )}
            {s.donateButton?.href && (
              <Link href={s.donateButton.href} className={buttonClass('gold', 'sm')}>
                {s.donateButton.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-y-0 right-0 z-50 h-full w-[86%] max-w-sm gap-4 overflow-y-auto border-l-0 bg-white p-0 shadow-lg duration-500 animate-in slide-in-from-right"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
            <div className="px-6 pb-10 pt-6">
              <Logo name={s.siteName} tagline={s.tagline} image={s.logo} />
              <nav className="mt-8 space-y-1" aria-label="Mobile navigation">
                {s.mobileNav.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="block border-b border-navy/[0.06] py-3 font-heading text-[0.95rem] font-semibold text-navy"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <p className="mt-7 font-heading text-[0.62rem] uppercase tracking-[0.18em] text-gold-deep">{s.mobileGetInvolvedHeading}</p>
              <div className="mt-3 space-y-1">
                {s.getInvolved.map((item) => (
                  <Link key={item.href + item.label} href={item.href} className="block py-2 font-body text-[0.9rem] text-ink/70">
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 space-y-2">
                {s.donateButton?.href && (
                  <Link href={s.donateButton.href} className={buttonClass('gold', 'md', 'w-full')}>
                    {s.donateButton.label}
                  </Link>
                )}
                {s.mobileContactButton?.href && (
                  <Link href={s.mobileContactButton.href} className={buttonClass('outline', 'md', 'w-full')}>
                    {s.mobileContactButton.label}
                  </Link>
                )}
              </div>
              <div className="mt-8 space-y-1.5 text-[0.85rem] text-ink/60">
                <a href={`mailto:${s.email}`} className="block hover:text-navy">
                  {s.email}
                </a>
                {s.phones[0] && (
                  <a href={telHref(s.phones[0].number)} className="block hover:text-navy">
                    {s.phones[0].number}
                  </a>
                )}
                <p>{location}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
