'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ActionResult } from '@/app/admin/(panel)/sponsorship/_actions';
import { useUnsavedWarning } from '@/components/admin/useUnsaved';
import { Button, Card } from '@/components/admin/ui';
import { isVisible, withOverrides, type FieldOverrides, type Value, type Values } from '@/lib/sponsorship/fields';
import { validateAll, type Errors } from '@/lib/sponsorship/schema';
import { cn } from '@/lib/utils';
import { FieldInput } from './FieldInput';

/** Admin version of the registration form: the same fields and rules, on one page. */
export function ApplicationForm({
  stepIds,
  initial,
  overrides,
  save,
  submitLabel = 'Save changes',
  redirectTo,
}: {
  stepIds: string[];
  initial: Values;
  overrides: FieldOverrides;
  save: (values: Values) => Promise<ActionResult>;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const steps = useMemo(
    () =>
      withOverrides(overrides)
        .filter((s) => stepIds.includes(s.id))
        .map((s) => ({ ...s, groups: s.groups.map((g) => ({ ...g, fields: g.fields.filter((f) => f.type !== 'file' && f.type !== 'signature') })) })),
    [overrides, stepIds],
  );
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedWarning(dirty);

  function showErrors(found: Errors) {
    setErrors(found);
    toast.error('Please check the highlighted fields.');
    requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(found)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  async function submit() {
    const check = validateAll(steps, values);
    if (Object.keys(check.errors).length) return showErrors(check.errors);
    setBusy(true);
    const res = await save(values);
    setBusy(false);
    if (!res.ok) {
      if (res.errors) showErrors(res.errors);
      else toast.error(res.error ?? 'This could not be saved.');
      return;
    }
    setDirty(false);
    toast.success('Saved');
    if (redirectTo) router.push(redirectTo.replace('[id]', res.id ?? ''));
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <Card key={step.id}>
          <h2 className="text-base text-navy">{step.title}</h2>
          <div className={cn('mt-4 grid gap-6', step.columns === 2 && 'md:grid-cols-2')}>
            {step.groups.map((g) => (
              <fieldset key={g.title ?? step.id} className="min-w-0">
                {g.title && <legend className="mb-3 font-heading text-sm font-semibold text-navy">{g.title}</legend>}
                <div className="grid gap-4 sm:grid-cols-2">
                  {g.fields
                    .filter((f) => isVisible(f, values))
                    .map((f) => (
                      <div key={f.name} className={f.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
                        <FieldInput
                          field={f}
                          value={values[f.name]}
                          error={errors[f.name]}
                          onChange={(v: Value) => {
                            setValues((x) => ({ ...x, [f.name]: v }));
                            setErrors((x) => ({ ...x, [f.name]: '' }));
                            setDirty(true);
                          }}
                          token={null}
                          onToken={() => undefined}
                        />
                      </div>
                    ))}
                </div>
              </fieldset>
            ))}
          </div>
        </Card>
      ))}
      <div className="sticky bottom-3 flex justify-end">
        <Button variant="primary" onClick={submit} disabled={busy} className="shadow-lg">
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
