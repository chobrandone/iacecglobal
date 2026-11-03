'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { subscribe } from '@/app/actions/public';
import { cn } from '@/lib/utils';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({
  tone = 'light',
  source = 'Website',
  placeholder = 'Your email address',
  success = 'Thank you — you are on the list.',
}: {
  tone?: 'light' | 'dark';
  source?: string;
  placeholder?: string;
  success?: string;
}) {
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'invalid' | 'loading' | 'done' | 'error'>('idle');
  const dark = tone === 'dark';
  const id = `newsletter-${source}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setState('invalid');
      return;
    }
    setState('loading');
    const res = await subscribe({ email, source, __trap: trap }).catch(() => ({ ok: false }));
    if (res.ok) {
      setState('done');
      setEmail('');
    } else setState('error');
  }

  if (state === 'done') {
    return (
      <p className={cn('flex items-center gap-2 text-[0.9rem]', dark ? 'text-gold-light' : 'text-navy')}>
        <Check className="h-4 w-4" aria-hidden="true" />
        {success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border p-1.5',
          dark ? 'border-white/20 bg-white/[0.06]' : 'border-navy/15 bg-white',
        )}
      >
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== 'idle') setState('idle');
          }}
          placeholder={placeholder}
          className={cn(
            'min-w-0 flex-1 bg-transparent px-3 py-2 font-body text-[0.92rem] outline-none',
            dark ? 'text-white placeholder:text-white/40' : 'text-ink placeholder:text-ink/40',
          )}
        />
        <input
          type="text"
          name="__trap"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          aria-label="Subscribe to the newsletter"
          className={cn(
            'flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors',
            dark ? 'bg-gold text-navy hover:bg-gold-light' : 'bg-navy text-white hover:bg-navy-800',
          )}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {state === 'invalid' && (
        <p className={cn('mt-2 text-[0.8rem]', dark ? 'text-gold-light' : 'text-destructive')}>Please enter a valid email address.</p>
      )}
      {state === 'error' && (
        <p className={cn('mt-2 text-[0.8rem]', dark ? 'text-gold-light' : 'text-destructive')}>
          We could not save your subscription. Please try again.
        </p>
      )}
    </form>
  );
}
