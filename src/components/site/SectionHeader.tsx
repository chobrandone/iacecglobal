import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

export function Eyebrow({ children, className, line = true }: { children: ReactNode; className?: string; line?: boolean }) {
  return (
    <span className={cn('eyebrow', className)}>
      {line && <span className="eyebrow-line" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const light = tone === 'light';
  return (
    <Reveal className={cn(align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {eyebrow && (
        <Eyebrow className={cn(align === 'center' && 'justify-center', light && 'text-gold-light')}>{eyebrow}</Eyebrow>
      )}
      <h2
        className={cn(
          'mt-4 text-[1.9rem] leading-[1.12] sm:text-[2.3rem] lg:text-[2.7rem]',
          light ? 'text-white' : 'text-navy',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('mt-5 text-[1.05rem] leading-relaxed', light ? 'text-white/75' : 'text-ink/70')}>{description}</p>
      )}
    </Reveal>
  );
}
