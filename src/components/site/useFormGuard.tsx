'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getFormToken } from '@/app/actions/public';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Turnstile = { render(el: HTMLElement, options: { sitekey: string; callback(token: string): void }): string; reset(id: string): void };
const turnstile = () => (window as unknown as { turnstile?: Turnstile }).turnstile;

/** A fresh one-use token for each attempt, plus the Turnstile check when it is switched on. */
export function useFormGuard() {
  const [token, setToken] = useState<string>();
  const [challenge, setChallenge] = useState<string>();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  const refresh = useCallback(() => {
    getFormToken().then(setToken).catch(() => undefined);
    if (widget.current) {
      setChallenge(undefined);
      turnstile()?.reset(widget.current);
    }
  }, []);

  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!SITE_KEY) return;
    const show = () => {
      if (box.current && !widget.current) widget.current = turnstile()?.render(box.current, { sitekey: SITE_KEY, callback: setChallenge }) ?? null;
    };
    if (turnstile()) return show();
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = show;
    document.head.appendChild(script);
  }, []);

  return { guard: { token, turnstile: challenge }, refresh, widget: SITE_KEY ? <div ref={box} className="mt-4" /> : null };
}
