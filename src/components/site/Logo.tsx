import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImageValue } from '@/lib/fields';

export function Emblem({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path d="M6 30a18 18 0 0 1 36 0" stroke="#CE9428" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M13.5 30a10.5 10.5 0 0 1 21 0" stroke="#DEB155" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path
        d="M24 39.6c-3.6-2.4-7.9-3.7-12-3.7v-4.9c4.9 0 8.9 1.4 12 3.8 3.1-2.4 7.1-3.8 12-3.8v4.9c-4.1 0-8.4 1.3-12 3.7z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  tone = 'dark',
  name,
  tagline,
  image,
  className,
}: {
  tone?: 'dark' | 'light';
  name: string;
  tagline: string;
  image?: ImageValue;
  className?: string;
}) {
  const light = tone === 'light';
  // An uploaded logo is the complete lockup (emblem + wordmark), so it is shown on its own.
  if (image?.src) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <Image
          src={image.src}
          alt={image.alt || name}
          width={light ? 1031 : 1066}
          height={light ? 360 : 240}
          priority={!light}
          sizes={light ? '260px' : '220px'}
          className={light ? 'h-20 w-auto sm:h-[5.5rem]' : 'h-10 w-auto sm:h-12'}
        />
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span className={light ? 'text-white' : 'text-navy'}>
        <Emblem className="h-10 w-10 sm:h-11 sm:w-11" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-[1.3rem] font-extrabold tracking-[0.2em] sm:text-[1.4rem]',
            light ? 'text-white' : 'text-navy',
          )}
        >
          {name}
        </span>
        {tagline && (
          <span
            className={cn(
              'mt-1.5 max-w-[190px] font-body text-[0.52rem] uppercase leading-tight tracking-[0.13em]',
              light ? 'text-white/60' : 'text-navy/55',
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
