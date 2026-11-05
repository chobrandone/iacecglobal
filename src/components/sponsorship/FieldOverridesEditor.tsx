'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ActionResult } from '@/app/admin/(panel)/sponsorship/_actions';
import { Button, Input, Label, Textarea } from '@/components/admin/ui';
import type { FieldOverrides, Option } from '@/lib/sponsorship/fields';

type EditableField = { name: string; label: string; hint: string; group: string; options: Option[]; freeOptions: boolean };
export type EditableStep = { id: string; title: string; fields: EditableField[] };

export function FieldOverridesEditor({ steps, initial, save }: { steps: EditableStep[]; initial: FieldOverrides; save: (overrides: FieldOverrides) => Promise<ActionResult> }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<FieldOverrides>(initial);
  const [busy, setBusy] = useState(false);

  const change = (name: string, patch: FieldOverrides[string]) => setOverrides((o) => ({ ...o, [name]: { ...o[name], ...patch } }));

  async function submit() {
    setBusy(true);
    const res = await save(overrides);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error ?? 'This could not be saved.');
    toast.success('Saved');
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <details key={step.id} className="rounded-lg border border-navy/10 px-4 py-2">
          <summary className="cursor-pointer font-heading text-sm font-semibold text-navy">{step.title}</summary>
          <div className="mt-3 space-y-4 pb-2">
            {step.fields.map((f) => {
              const current = overrides[f.name] ?? {};
              const options = current.options ?? f.options;
              const id = `o-${f.name}`;
              return (
                <div key={f.name} className="grid gap-2 border-t border-navy/[0.06] pt-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={id}>{f.group ? `${f.group}: label` : 'Label'}</Label>
                    <Input id={id} value={current.label ?? f.label} onChange={(e) => change(f.name, { label: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor={`${id}-hint`}>Help text</Label>
                    <Input id={`${id}-hint`} value={current.hint ?? f.hint} onChange={(e) => change(f.name, { hint: e.target.value })} />
                  </div>
                  {f.freeOptions && (
                    <div className="sm:col-span-2">
                      <Label htmlFor={`${id}-options`} help="One choice per line. Keep “Other”, which opens the text box.">
                        Choices
                      </Label>
                      <Textarea
                        id={`${id}-options`}
                        rows={5}
                        value={options.map((o) => o.label).join('\n')}
                        onChange={(e) => change(f.name, { options: e.target.value.split('\n').map((label) => ({ value: label, label })) })}
                      />
                    </div>
                  )}
                  {!f.freeOptions &&
                    f.options.map((o, i) => (
                      <div key={o.value}>
                        <Label htmlFor={`${id}-${o.value}`}>Choice {i + 1} wording</Label>
                        <Input
                          id={`${id}-${o.value}`}
                          value={options[i]?.label ?? o.label}
                          onChange={(e) => change(f.name, { options: f.options.map((x, n) => ({ value: x.value, label: n === i ? e.target.value : (options[n]?.label ?? x.label) })) })}
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </details>
      ))}
      <Button onClick={submit} disabled={busy} className="mt-2">
        {busy ? 'Saving…' : 'Save wording'}
      </Button>
    </div>
  );
}
