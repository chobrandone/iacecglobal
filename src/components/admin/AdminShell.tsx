'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ClipboardList,
  ExternalLink,
  FileText,
  HeartHandshake,
  Images,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { logout } from '@/app/admin/_actions/admin';
import { cn } from '@/lib/utils';

const icons = { LayoutDashboard, FileText, Library, Images, Inbox, HeartHandshake, ClipboardList, Mail, Settings, Users, UserRound };
export type NavItem = { href: string; label: string; icon: keyof typeof icons };

export function AdminShell({ nav, user, children }: { nav: NavItem[]; user: { name: string; email: string; role: string }; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const sidebar = (
    <nav className="flex h-full flex-col bg-navy text-white" aria-label="Admin">
      <div className="px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/brand/iacec-logo-light.png" alt="IACEC" className="h-14 w-auto" />
        <p className="mt-2 text-[0.7rem] text-white/50">Website admin</p>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((item) => {
          const Icon = icons[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(item.href) ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-4">
        <a href="/" target="_blank" className="mb-3 flex items-center gap-2 text-xs text-gold-light hover:text-gold">
          <ExternalLink className="h-3.5 w-3.5" /> View website
        </a>
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-white/50">{user.role}</p>
        <form action={logout} className="mt-3">
          <button type="submit" className="flex items-center gap-2 text-xs text-white/70 hover:text-white">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/brand/iacec-logo.png" alt="IACEC" className="h-8 w-auto" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg border border-navy/15 p-2 text-navy">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-5 text-white/70">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
