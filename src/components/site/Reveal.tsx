import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll reveal. Rendered on the server; the single observer in <RevealObserver/> adds
 * `is-visible`, so no per-element JavaScript is shipped.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
  id,
}: {
  children?: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  id?: string;
}) {
  const style = delay ? ({ '--reveal-delay': `${delay}s` } as CSSProperties) : undefined;
  return (
    <Tag id={id} className={cn('reveal', className)} style={style}>
      {children}
    </Tag>
  );
}
