'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { submitApplication } from '@/app/actions/sponsorship';
import { buttonClass } from '@/components/site/Button';
import { useFormGuard } from '@/components/site/useFormGuard';
import { displayValue } from '@/lib/sponsorship/display';
import { allFields, isVisible, withOverrides, type FieldOverrides, type Value, type Values } from '@/lib/sponsorship/fields';
import { validateAll, validateStep, type Errors } from '@/lib/sponsorship/schema';
import { cn } from '@/lib/utils';
import { FieldInput } from './FieldInput';

const DRAFT_KEY = 'iacec-sponsorship-draft';
const DRAFT_DAYS = 7;

type Draft = { savedAt: number; step: number; values: Values; token: string | null };

function readDraft(): Draft | null {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
    if (draft && Date.now() - draft.savedAt < DRAFT_DAYS * 86_400_000) return draft;
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private browsing or blocked storage: the form still works, without autosave.
  }
  return null;
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing was stored.
  }
}

export function Wizard({ programmeName, overrides, today }: { programmeName: string; overrides: FieldOverrides; today: string }) {
  const steps = useMemo(() => withOverrides(overrides), [overrides]);
  const reviewStep = steps.length;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ signature_date: today });
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [trap, setTrap] = useState('');
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const { guard, refresh, widget } = useFormGuard();

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setValues(draft.values);
      setStep(Math.min(draft.step, reviewStep));
      setToken(draft.token);
      setRestored(true);
    }
    setReady(true);
  }, [reviewStep]);

  useEffect(() => {
    if (!ready || reference) return;
    if (Object.keys(values).every((name) => name === 'signature_date')) return; // Nothing typed yet.
    const sensitive = new Set(allFields(steps).filter((f) => f.sensitive).map((f) => f.name));
    const safe = Object.fromEntries(Object.entries(values).filter(([name]) => !sensitive.has(name)));
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), step, values: safe, token } satisfies Draft));
    } catch {
      // Storage full or blocked: carry on without autosave.
    }
  }, [values, step, token, ready, reference, steps]);

  function go(next: number) {
    setErrors({});
    setStep(next);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showErrors(found: Errors) {
    setErrors(found);
    requestAnimationFrame(() => {
      const name = Object.keys(found)[0];
      document.querySelector(`[data-field="${name}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function next() {
    const found = validateStep(steps[step], values);
    if (Object.keys(found).length) return showErrors(found);
    go(step + 1);
  }

  function set(name: string, value: Value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  function startAgain() {
    clearDraft();
    setValues({ signature_date: today });
    setToken(null);
    setRestored(false);
    setErrors({});
    setStep(0);
  }

  async function submit() {
    const check = validateAll(steps, values);
    if (check.firstStep !== null) {
      go(check.firstStep);
      setErrors(check.errors);
      return;
    }
    setState('sending');
    try {
      const res = await submitApplication(values, token, trap, guard);
      refresh();
      if (res.ok) {
        clearDraft();
        setReference(res.reference);
        top.current?.scrollIntoView({ block: 'start' });
        return;
      }
      if (res.errors && res.firstStep !== undefined && res.firstStep !== null) {
        setState('idle');
        go(res.firstStep);
        setErrors(res.errors);
        return;
      }
      setMessage(res.message ?? 'We could not send this just now. Please try again.');
      setState('error');
    } catch {
      setMessage('We could not send this just now. Your answers are still here, so please try again.');
      setState('error');
    }
  }

  if (reference !== null) {
    return (
      <div ref={top} className="scroll-mt-28 rounded-[1.5rem] border border-gold/35 bg-gold-tint/60 p-8 text-center sm:p-10" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <Check className="h-6 w-6 text-gold-deep" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-[1.35rem] text-navy">Your application has been received.</h2>
        <p className="mt-4 text-[0.9rem] text-ink/65">Your reference number</p>
        <p className="mt-1 font-heading text-[1.3rem] font-bold tracking-wide text-navy" data-reference>
          {reference}
        </p>
        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink/65">
          Please keep this number. An IACEC member will contact you to arrange a home visit.
        </p>
      </div>
    );
  }

  const percent = Math.round((step / reviewStep) * 100);
  const current = steps[step];

  return (
    <div ref={top} className="scroll-mt-28">
      <div className="mb-6">
        <div className="flex items-center justify-between font-heading text-[0.75rem] font-semibold text-ink/55">
          <span>{step === reviewStep ? 'Review' : `Step ${step + 1} of ${reviewStep}`}</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Form progress">
          <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {restored && (
        <div className="mb-5 rounded-xl border border-gold/35 bg-gold-tint/60 px-4 py-3 text-[0.86rem] leading-relaxed text-ink/70">
          We found the form you started on this phone. The national ID number and health details are not saved here, so please enter them again.
          <button type="button" onClick={startAgain} className="ml-1 font-semibold text-navy underline">
            Clear this form from this phone
          </button>
        </div>
      )}

      <div className="rounded-[1.6rem] border border-navy/[0.08] bg-white p-6 shadow-soft sm:p-8">
        {step === reviewStep ? (
          <>
            <h2 className="text-[1.35rem] text-navy">Check your answers</h2>
            <p className="mt-2 text-[0.92rem] text-ink/60">Please read everything once more before you send it.</p>
            <div className="mt-6 space-y-6">
              {steps.map((s, i) => (
                <section key={s.id} className="border-t border-navy/10 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[1rem] text-navy">{s.title}</h3>
                    <button type="button" onClick={() => go(i)} aria-label={`Change ${s.title}`} className="font-heading text-[0.78rem] font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                      Change
                    </button>
                  </div>
                  {s.groups.map((g) => {
                    const rows = g.fields.filter((f) => isVisible(f, values)).map((f) => [f, displayValue(f, values[f.name])] as const).filter(([, text]) => text);
                    if (!rows.length) return null;
                    return (
                      <div key={g.title ?? s.id} className="mt-3">
                        {g.title && <p className="font-heading text-[0.8rem] font-semibold text-ink/55">{g.title}</p>}
                        <dl className="mt-1 space-y-1.5 text-[0.9rem]">
                          {rows.map(([f, text]) => (
                            <div key={f.name} className="sm:grid sm:grid-cols-[1fr_1.2fr] sm:gap-3">
                              <dt className="text-ink/55">{f.label}</dt>
                              <dd className="break-words text-ink">{text}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[1.35rem] text-navy">{current.title}</h2>
            {current.intro && <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/60">{current.intro}</p>}
            {current.id === 'about' && (
              <div className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-ink/70">
                <p>The {programmeName} supports children who have lost one or both parents. Priority goes to children known to IACEC partners and members.</p>
                <p>Sponsors pay school fees, help with material needs and visit the child.</p>
                <p className="flex gap-2 rounded-xl bg-mist px-4 py-3 text-[0.9rem]">
                  <Lock className="mt-0.5 h-4 w-4 flex-none text-gold-deep" aria-hidden="true" />
                  All information is confidential and seen only by authorised IACEC sponsorship staff.
                </p>
                <p className="text-[0.9rem]">
                  Prefer paper?{' '}
                  <a href="/community-support/register/paper-form.pdf" className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                    Download paper form (PDF)
                  </a>
                </p>
              </div>
            )}
            <div className={cn('mt-6 grid gap-8', current.columns === 2 && 'md:grid-cols-2')}>
              {current.groups.map((g) => (
                <fieldset key={g.title ?? current.id} className="min-w-0">
                  {g.title && <legend className="mb-3 font-heading text-[0.95rem] font-semibold text-navy">{g.title}</legend>}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {g.fields
                      .filter((f) => isVisible(f, values))
                      .map((f) => (
                        <div key={f.name} className={f.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
                          <FieldInput field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} token={token} onToken={setToken} />
                        </div>
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </>
        )}

        {step === reviewStep && widget}
        <input type="text" name="__trap" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="hidden" aria-hidden="true" />

        {state === 'error' && (
          <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-[0.86rem] text-destructive" role="alert">
            {message}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className={buttonClass('outline')}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          {step === reviewStep ? (
            <button type="button" onClick={submit} disabled={state === 'sending'} className={buttonClass('primary')}>
              {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {state === 'sending' ? 'Sending…' : 'Submit application'}
            </button>
          ) : (
            <button type="button" onClick={next} className={buttonClass('primary')}>
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
