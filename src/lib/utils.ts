import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Largest upload the server accepts. Vercel rejects request bodies over 4.5 MB before our code runs. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Turns "+237 6 77 72 16 78" into "+237677721678" for tel: links. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function formatDate(date: Date | string, month: 'short' | 'long' = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month, year: 'numeric' });
}

/** Splits plain text into paragraphs (one per non-empty line). */
export function paragraphs(text: string | null | undefined) {
  return (text ?? '').split('\n').map((p) => p.trim()).filter(Boolean);
}

export function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}
