import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn, isExternal } from '@/lib/utils';

export const buttonVariants = {
  primary: 'bg-navy text-white hover:bg-navy-800 shadow-soft',
  gold: 'bg-gold text-navy hover:bg-gold-light shadow-soft',
  outline: 'border border-navy/25 text-navy hover:border-navy hover:bg-navy/[0.04]',
  white: 'bg-white text-navy hover:bg-gold-tint',
  ghostLight: 'border border-white/35 text-white hover:bg-white/10',
  quiet: 'text-navy hover:text-gold',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-60',
    size === 'sm' ? 'px-5 py-2.5 text-[0.8rem]' : 'px-6 py-3.5 text-sm',
    size === 'lg' ? 'px-8 py-4 text-[0.95rem]' : '',
    buttonVariants[variant],
    className,
  );
}

/** Link that switches between next/link and <a> for external targets. */
export function SmartLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (isExternal(href)) {
    const newTab = href.startsWith('http');
    return (
      <a href={href} className={className} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || '/'} className={className} {...rest}>
      {children}
    </Link>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SmartLink href={href} className={buttonClass(variant, size, className)}>
      {children}
    </SmartLink>
  );
}
