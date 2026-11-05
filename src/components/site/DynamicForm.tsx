'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { submitForm } from '@/app/actions/public';
import { validateSubmission, type PublicFormDefinition } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { useFormGuard } from './useFormGuard';

// The live site's chevron background class never compiles (spaces inside an arbitrary value),
// so its selects render with appearance:none and no arrow. Reproduced as-is.
const SELECT_CLASS = 'field-input appearance-none bg-no-repeat pr-10';

type Values = Record<string, string | boolean>;

function initialValues(def: PublicFormDefinition): Values {
  const v: Values = {};
  for (const field of def.fields) v[field.name] = field.type === 'checkbox' ? false : '';
  return v;
}

export function DynamicForm({ def, prefillTopic = false }: { def: PublicFormDefinition; prefillTopic?: boolean }) {
  const [values, setValues] = useState<Values>(() => initialValues(def));
  const [trap, setTrap] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorText, setErrorText] = useState(def.errorMessage);
  const { guard, refresh, widget } = useFormGuard();

  // /contact?topic=… pre-fills an event registration, as on the live site.
  useEffect(() => {
    if (!prefillTopic) return;
    const topic = new URLSearchParams(window.location.search).get('topic');
    if (!topic) return;
    setValues((v) => ({
      ...v,
      ...('message' in v ? { message: `I would like to register my interest in: ${topic}.` } : {}),
      ...('subject' in v ? { subject: def.fields.find((f) => f.name === 'subject')?.options?.includes('Event registration') ? 'Event registration' : '' } : {}),
    }));
  }, [prefillTopic, def.fields]);

  function set(name: string, value: string | boolean) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return;
    const errs = validateSubmission(def.fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState('loading');
    try {
      const res = await submitForm(def.key, { ...values, __trap: trap }, guard);
      refresh();
      if (res.ok) setState('done');
      else {
        if (res.errors) setErrors(res.errors);
        setErrorText(res.message ?? def.errorMessage);
        setState(res.errors ? 'idle' : 'error');
      }
    } catch {
      setErrorText(def.errorMessage);
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-[1.5rem] border border-gold/35 bg-gold-tint/60 p-8 text-center sm:p-10" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <Check className="h-6 w-6 text-gold-deep" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-[1.25rem] text-navy">{def.successTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink/65">{def.successBody}</p>
        <button
          type="button"
          onClick={() => {
            setValues(initialValues(def));
            setState('idle');
          }}
          className="mt-6 font-heading text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" data-form={def.key}>
      <div className="grid gap-5 sm:grid-cols-2">
        {def.fields.map((field) => {
          const err = errors[field.name];
          const id = `f-${field.name}`;
          const value = values[field.name];
          return (
            <div key={field.name} className={field.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
              {field.type !== 'checkbox' && (
                <label className="field-label" htmlFor={id}>
                  {field.label}
                  {field.required && <span className="ml-1 text-gold-deep">*</span>}
                </label>
              )}
              {field.type === 'textarea' ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={field.rows || 4}
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!err}
                  className="field-input resize-y"
                />
              ) : field.type === 'select' ? (
                <select
                  id={id}
                  name={field.name}
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                  aria-invalid={!!err}
                  className={SELECT_CLASS}
                >
                  <option value="">Please choose</option>
                  {(field.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex cursor-pointer items-start gap-3 text-[0.9rem] leading-relaxed text-ink/70">
                  <input
                    id={id}
                    name={field.name}
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => set(field.name, e.target.checked)}
                    aria-invalid={!!err}
                    className="mt-0.5 h-4 w-4 flex-none rounded border-navy/30 accent-gold"
                  />
                  <span>
                    {field.label}
                    {field.required && <span className="ml-1 text-gold-deep">*</span>}
                  </span>
                </label>
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type || 'text'}
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!err}
                  className="field-input"
                />
              )}
              {field.hint && !err && <p className="field-hint">{field.hint}</p>}
              {err && (
                <p className={cn('mt-1.5 text-[0.8rem] text-destructive')} role="alert">
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {widget}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-3.5 font-heading text-sm font-semibold text-white shadow-soft transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {state === 'loading' ? 'Sending…' : def.submitLabel}
        </button>
        <p className="text-[0.78rem] leading-relaxed text-ink/45">
          {def.note || 'Your details are kept private and used only to respond to your enquiry.'}
        </p>
      </div>
      {state === 'error' && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-[0.86rem] text-destructive" role="alert">
          {errorText}
        </p>
      )}
    </form>
  );
}
