import type { NewsArticle, Programme } from '@prisma/client';
import type { ImageValue, LinkValue } from '@/lib/fields';

export type RenderContext = {
  programme?: Programme;
  article?: NewsArticle;
};

export type SectionProps<C> = {
  c: C;
  bg: string;
  anchor?: string | null;
  ctx: RenderContext;
  /** True for the first section on a page (gets image priority). */
  first?: boolean;
};

export type { ImageValue, LinkValue };

export type Header = { eyebrow: string; heading: string; description: string };
export type StyledButton = { label: string; href: string; style: 'primary' | 'gold' | 'outline' | 'ghostLight' };

export function bgClass(bg: string) {
  return bg === 'navy' ? 'bg-navy' : bg === 'mist' ? 'bg-mist' : 'bg-white';
}
