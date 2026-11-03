'use client';

import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';

const btn: Record<BtnVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-800',
  gold: 'bg-gold text-navy hover:bg-gold-light',
  secondary: 'bg-mist text-navy hover:bg-navy/10',
  outline: 'border border-navy/20 text-navy hover:bg-navy/[0.04]',
  ghost: 'text-ink/70 hover:bg-navy/[0.05] hover:text-navy',
  danger: 'bg-destructive text-white hover:bg-destructive/90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'icon' }>(
  function Button({ variant = 'primary', size = 'md', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-heading font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
          size === 'sm' ? 'h-8 px-3 text-xs' : size === 'icon' ? 'h-9 w-9' : 'h-10 px-4 text-sm',
          btn[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-navy/15 bg-white px-3 text-[0.95rem] text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20',
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-[0.95rem] leading-relaxed text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20',
        className,
      )}
      {...props}
    />
  );
});

export function Select({
  value,
  onChange,
  options,
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-10 w-full rounded-lg border border-navy/15 bg-white px-3 text-[0.95rem] text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/20', className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 flex-none rounded-full transition-colors', checked ? 'bg-gold' : 'bg-navy/20')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
      {label && <span className="text-sm text-ink/80">{label}</span>}
    </label>
  );
}

export function Label({ children, htmlFor, help }: { children: ReactNode; htmlFor?: string; help?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="font-heading text-[0.78rem] font-semibold text-navy">
        {children}
      </label>
      {help && <p className="mt-0.5 text-xs text-ink/50">{help}</p>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-navy/[0.09] bg-white p-5 shadow-sm', className)}>{children}</div>;
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'gold' | 'green' | 'red' | 'muted' }) {
  const tones = {
    default: 'bg-navy/[0.07] text-navy',
    gold: 'bg-gold-tint text-gold-deep',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    muted: 'bg-slate-100 text-slate-600',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[0.68rem] font-semibold', tones[tone])}>{children}</span>;
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.6rem] leading-tight text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-5xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-3">
          <h2 className="text-base text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink/60 hover:bg-mist" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
