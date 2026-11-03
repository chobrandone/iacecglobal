import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Responsive image filling a sized wrapper — the live site wraps images the same way:
 * an aspect-ratio box with the image absolutely positioned and `object-fit: cover`.
 */
export function Picture({
  src,
  alt,
  className,
  imgClassName,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority,
  focal,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  focal?: string;
}) {
  return (
    <span className={cn('relative inline-block overflow-hidden', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn('object-cover', imgClassName)}
          style={focal ? { objectPosition: focal } : undefined}
        />
      ) : (
        <span className="absolute inset-0 bg-mist" aria-hidden="true" />
      )}
    </span>
  );
}
