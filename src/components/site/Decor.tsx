import { cn } from '@/lib/utils';

/** Three concentric gold rings used as a background motif. */
export function Rings({
  className,
  opacity = 0.5,
  tone = 'gold',
}: {
  className?: string;
  opacity?: number;
  tone?: 'gold' | 'white';
}) {
  const stroke = tone === 'white' ? '#FFFFFF' : '#CE9428';
  return (
    <svg viewBox="0 0 600 600" aria-hidden="true" className={cn('pointer-events-none absolute', className)} fill="none" style={{ opacity }}>
      <circle cx="300" cy="300" r="298" stroke={stroke} strokeWidth="1" />
      <circle cx="300" cy="300" r="232" stroke={stroke} strokeWidth="1" opacity="0.6" />
      <circle cx="300" cy="300" r="160" stroke={stroke} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Double arch drawn above the anchor scripture. */
export function Arch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" aria-hidden="true" className={className} fill="none" preserveAspectRatio="none">
      <path d="M2 118C60 40 140 4 200 4s140 36 198 114" stroke="#CE9428" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path d="M42 118C90 62 148 34 200 34s110 28 158 84" stroke="#CE9428" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** Hand-drawn underline beneath "Generation." in the home hero. */
export function Underline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 16" className={className} fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path d="M2 12c60-9 130-10 316-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
