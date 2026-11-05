'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionResult } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button, Input, Label, Select, Textarea } from '@/components/admin/ui';
import type { FileRef } from '@/lib/sponsorship/fields';
import { uploadFile } from './upload';

export type QuickField = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'files';
  options?: { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
};

type FormValues = Record<string, string | FileRef[] | undefined>;

/** Small admin form for logging a visit, a payment, a note and so on. */
export function QuickForm({
  fields,
  initial = {},
  submitLabel,
  keep = false,
  action,
}: {
  fields: QuickField[];
  initial?: Record<string, string | undefined>;
  submitLabel: string;
  /** Keep the values after saving, for records that are edited rather than added. */
  keep?: boolean;
  action: (values: FormValues, token: string | null) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initial);
  const [busy, setBusy] = useState(false);
  const token = useRef<string | null>(null);

  const set = (name: string, value: string | FileRef[]) => setValues((v) => ({ ...v, [name]: value }));

  async function upload(name: string, list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const refs = (values[name] ?? []) as FileRef[];
      const added: FileRef[] = [];
      for (const file of Array.from(list)) {
        const done = await uploadFile(file, token.current, () => undefined);
        token.current = done.token;
        added.push(done.ref);
      }
      set(name, [...refs, ...added]);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.name]);
    if (missing) return void toast.error(`Please complete: ${missing.label}`);
    setBusy(true);
    const res = await action(values, token.current);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be saved.');
    toast.success('Saved');
    if (!keep) setValues(initial);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `q-${submitLabel.replace(/\W/g, '')}-${f.name}`;
        const value = typeof values[f.name] === 'string' ? (values[f.name] as string) : '';
        return (
          <div key={f.name} className={f.wide || f.type === 'textarea' || f.type === 'files' ? 'sm:col-span-2' : undefined}>
            <Label htmlFor={id}>
              {f.label}
              {f.required && ' *'}
            </Label>
            {f.type === 'textarea' ? (
              <Textarea id={id} rows={3} value={value} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === 'select' ? (
              <Select id={id} value={value} onChange={(v) => set(f.name, v)} options={[{ value: '', label: 'Please choose' }, ...(f.options ?? [])]} />
            ) : f.type === 'files' ? (
              <div>
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-navy/20 px-4 font-heading text-sm font-semibold text-navy hover:bg-navy/[0.04]">
                  <Upload className="h-4 w-4" aria-hidden="true" /> Add files
                  <input id={id} type="file" multiple accept="image/*,application/pdf" onChange={(e) => upload(f.name, e.target.files)} className="sr-only" />
                </label>
                {((values[f.name] ?? []) as FileRef[]).map((r) => (
                  <p key={r.key} className="mt-1 text-xs text-ink/60">
                    {r.filename}
                  </p>
                ))}
              </div>
            ) : (
              <Input id={id} type={f.type === 'date' ? 'date' : 'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} value={value} onChange={(e) => set(f.name, e.target.value)} />
            )}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
