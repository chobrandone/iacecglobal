'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import type { Field, FileRef, Sibling, Value } from '@/lib/sponsorship/fields';
import { cn } from '@/lib/utils';
import { uploadFile } from './upload';

const SELECT_CLASS = 'field-input appearance-none bg-no-repeat pr-10';

type Props = {
  field: Field;
  value: Value;
  error?: string;
  onChange: (value: Value) => void;
  token: string | null;
  onToken: (token: string) => void;
};

const choiceClass = (active: boolean) =>
  cn(
    'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[0.92rem] leading-snug transition-colors',
    active ? 'border-gold bg-gold-tint/60 text-navy' : 'border-navy/15 bg-white text-ink/75 hover:border-navy/30',
  );

function Choices({ field, value, onChange }: Pick<Props, 'field' | 'value' | 'onChange'>) {
  const options = field.type === 'yesno' ? [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] : (field.options ?? []);
  return (
    <div className={cn('grid gap-2', field.type === 'yesno' && 'grid-cols-2')} role="radiogroup" aria-label={field.label}>
      {options.map((o) => (
        <label key={o.value} className={choiceClass(value === o.value)}>
          <input type="radio" name={field.name} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 h-4 w-4 flex-none accent-gold" />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function Checks({ field, value, onChange }: Pick<Props, 'field' | 'value' | 'onChange'>) {
  const selected = (value ?? []) as string[];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(field.options ?? []).map((o) => {
        const on = selected.includes(o.value);
        return (
          <label key={o.value} className={choiceClass(on)}>
            <input
              type="checkbox"
              checked={on}
              onChange={() => onChange(on ? selected.filter((x) => x !== o.value) : [...selected, o.value])}
              className="mt-0.5 h-4 w-4 flex-none accent-gold"
            />
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function Siblings({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const rows = (value ?? []) as Sibling[];
  const update = (i: number, patch: Partial<Sibling>) => onChange(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input aria-label={`Name of brother or sister ${i + 1}`} placeholder="Name" value={row.name} onChange={(e) => update(i, { name: e.target.value })} className="field-input min-w-0 flex-1" />
          <input aria-label={`Age of brother or sister ${i + 1}`} placeholder="Age" inputMode="numeric" value={row.age} onChange={(e) => update(i, { age: e.target.value.replace(/\D/g, '') })} className="field-input w-20 flex-none" />
          <button type="button" onClick={() => onChange(rows.filter((_, n) => n !== i))} aria-label={`Remove brother or sister ${i + 1}`} className="flex-none p-2 text-ink/45 hover:text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { name: '', age: '' }])} className="inline-flex items-center gap-1.5 font-heading text-[0.8rem] font-semibold text-navy hover:text-gold-deep">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add a brother or sister
      </button>
    </div>
  );
}

function FileInput({ field, value, onChange, token, onToken }: Omit<Props, 'error'>) {
  const files = (value ?? []) as FileRef[];
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState('');

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setProblem('');
    let current = files;
    let session = token;
    try {
      for (const file of Array.from(list)) {
        setProgress(0);
        const done = await uploadFile(file, session, setProgress);
        session = done.token;
        onToken(done.token);
        current = field.multiple ? [...current, done.ref] : [done.ref];
        onChange(current);
      }
    } catch (e) {
      setProblem((e as Error).message);
    }
    setProgress(null);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {files.map((f) => (
            <li key={f.key} className="flex items-center gap-2 rounded-xl border border-navy/10 bg-mist px-3 py-2 text-[0.85rem] text-ink/75">
              <FileText className="h-4 w-4 flex-none text-gold-deep" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{f.filename}</span>
              <button type="button" onClick={() => onChange(files.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.filename}`} className="flex-none p-1 text-ink/45 hover:text-destructive">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {(field.multiple || files.length === 0) && (
        <label className={cn('flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-navy/25 bg-white px-4 py-4 font-heading text-[0.82rem] font-semibold text-navy hover:border-gold', progress !== null && 'pointer-events-none opacity-70')}>
          {progress !== null ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {progress !== null ? `Uploading… ${progress}%` : files.length ? 'Add another file' : 'Take a photo or choose a file'}
          <input ref={input} id={`f-${field.name}`} type="file" accept="image/*,application/pdf" multiple={field.multiple} onChange={(e) => add(e.target.files)} className="sr-only" aria-label={field.label} />
        </label>
      )}
      {problem && <p className="mt-1.5 text-[0.8rem] text-destructive" role="alert">{problem}</p>}
    </div>
  );
}

function SignaturePad({ value, onChange, token, onToken }: Omit<Props, 'error' | 'field'>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const saved = ((value ?? []) as FileRef[]).length > 0;
  const [state, setState] = useState<'idle' | 'saving' | 'failed'>('idle');

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    el.width = el.offsetWidth;
    el.height = el.offsetHeight;
  }, [saved]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  async function save() {
    const blob = await new Promise<Blob | null>((done) => canvas.current?.toBlob(done, 'image/png'));
    if (!blob) return;
    setState('saving');
    try {
      const done = await uploadFile(new File([blob], 'signature.png', { type: 'image/png' }), token, () => undefined);
      onToken(done.token);
      onChange([done.ref]);
      setState('idle');
    } catch {
      setState('failed');
    }
  }

  if (saved) {
    return (
      <p className="flex items-center justify-between rounded-xl border border-navy/10 bg-mist px-4 py-3 text-[0.88rem] text-ink/75">
        Signature saved.
        <button type="button" onClick={() => onChange([])} className="font-heading text-[0.78rem] font-semibold text-navy underline">
          Draw again
        </button>
      </p>
    );
  }
  return (
    <div>
      <canvas
        ref={canvas}
        aria-label="Signature pad"
        className="h-36 w-full touch-none rounded-xl border border-navy/15 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext('2d')!;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#022667';
          ctx.beginPath();
          ctx.moveTo(...point(e));
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext('2d')!;
          ctx.lineTo(...point(e));
          ctx.stroke();
          dirty.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
      <div className="mt-2 flex items-center gap-4">
        <button type="button" disabled={state === 'saving'} onClick={() => dirty.current && save()} className="font-heading text-[0.8rem] font-semibold text-navy underline disabled:opacity-60">
          {state === 'saving' ? 'Saving…' : 'Save signature'}
        </button>
        <button
          type="button"
          onClick={() => {
            const el = canvas.current;
            el?.getContext('2d')?.clearRect(0, 0, el.width, el.height);
            dirty.current = false;
          }}
          className="font-heading text-[0.8rem] font-semibold text-ink/55 underline"
        >
          Clear
        </button>
      </div>
      {state === 'failed' && <p className="mt-1.5 text-[0.8rem] text-destructive" role="alert">The signature could not be saved. Please try again, or continue without it.</p>}
    </div>
  );
}

export function FieldInput(props: Props) {
  const { field, value, error, onChange } = props;
  const id = `f-${field.name}`;
  const common = { id, name: field.name, 'aria-invalid': !!error };
  const text = typeof value === 'string' ? value : '';

  if (field.type === 'checkbox') {
    return (
      <div data-field={field.name}>
        <label className="flex cursor-pointer items-start gap-3 text-[0.92rem] leading-relaxed text-ink/75">
          <input {...common} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 flex-none rounded border-navy/30 accent-gold" />
          <span>
            {field.label}
            {field.required && <span className="ml-1 text-gold-deep">*</span>}
          </span>
        </label>
        {error && <p className="mt-1.5 text-[0.8rem] text-destructive" role="alert">{error}</p>}
      </div>
    );
  }

  const grouped = ['radio', 'yesno', 'checks', 'siblings', 'file', 'signature'].includes(field.type);
  return (
    <div data-field={field.name}>
      {grouped ? (
        <p className="field-label">
          {field.label}
          {field.required && <span className="ml-1 text-gold-deep">*</span>}
        </p>
      ) : (
        <label className="field-label" htmlFor={id}>
          {field.label}
          {field.required && <span className="ml-1 text-gold-deep">*</span>}
        </label>
      )}
      {field.type === 'textarea' ? (
        <textarea {...common} rows={3} value={text} onChange={(e) => onChange(e.target.value)} className="field-input resize-y" />
      ) : field.type === 'select' ? (
        <select {...common} value={text} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
          <option value="">Please choose</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'radio' || field.type === 'yesno' ? (
        <Choices field={field} value={value} onChange={onChange} />
      ) : field.type === 'checks' ? (
        <Checks field={field} value={value} onChange={onChange} />
      ) : field.type === 'siblings' ? (
        <Siblings value={value} onChange={onChange} />
      ) : field.type === 'file' ? (
        <FileInput {...props} />
      ) : field.type === 'signature' ? (
        <SignaturePad value={value} onChange={onChange} token={props.token} onToken={props.onToken} />
      ) : (
        <input
          {...common}
          type={field.type === 'date' || field.type === 'email' || field.type === 'tel' ? field.type : 'text'}
          inputMode={field.type === 'number' || field.type === 'money' ? 'numeric' : undefined}
          max={field.type === 'date' && field.past ? new Date().toISOString().slice(0, 10) : undefined}
          value={field.type === 'tel' && value === undefined ? '+237 ' : text}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
        />
      )}
      {field.hint && !error && <p className="field-hint">{field.hint}</p>}
      {error && <p className="mt-1.5 text-[0.8rem] text-destructive" role="alert">{error}</p>}
    </div>
  );
}
