'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SponsorshipNav({ settings }: { settings: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: '/admin/sponsorship', label: 'Overview' },
    { href: '/admin/sponsorship/applications', label: 'Applications' },
    { href: '/admin/sponsorship/sponsors', label: 'Sponsors' },
    ...(settings
      ? [
          { href: '/admin/sponsorship/backups', label: 'Backups' },
          { href: '/admin/sponsorship/settings', label: 'Programme settings' },
        ]
      : []),
  ];
  return (
    <nav aria-label="Sponsorship" className="mb-5 flex gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = l.href === '/admin/sponsorship' ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 font-heading text-[0.8rem] font-semibold', active ? 'bg-navy text-white' : 'text-ink/60 hover:bg-navy/[0.05] hover:text-navy')}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
