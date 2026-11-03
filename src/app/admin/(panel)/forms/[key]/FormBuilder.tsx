'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveFormDefinition } from '@/app/admin/_actions/admin';
import { FieldsEditor } from '@/components/admin/FieldEditor';
import { Button, Card } from '@/components/admin/ui';
import { useUnsavedWarning } from '@/components/admin/useUnsaved';
import { f } from '@/lib/fields';
import type { FormField } from '@/lib/forms';

const settingsFields = [
  f.text('name', 'Form name (admin only)'),
  f.text('submitLabel', 'Button label'),
  f.text('successTitle', 'Success message — heading'),
  f.textarea('successBody', 'Success message — text', 2),
  f.text('note', 'Small print beside the button', { help: 'Leave empty for “Your details are kept private…”' }),
  f.textarea('errorMessage', 'Error message', 2),
  f.textarea('recipients', 'Notification emails (one per line)', 3, { help: 'Leave empty to use the default notification email from Site settings.' }),
  f.bool('autoReply', 'Send an automatic reply to the person who submitted'),
  f.text('autoReplySubject', 'Automatic reply — subject'),
  f.textarea('autoReplyBody', 'Automatic reply — message', 4),
];

const fieldList = f.list(
  'fields',
  'Questions',
  [
    f.text('label', 'Question label'),
    f.text('name', 'Field name (for exports)', { help: 'Lowercase letters, numbers and underscores. Changing it starts a new column in exports.' }),
    f.select('type', 'Answer type', [
      { value: 'text', label: 'Short text' },
      { value: 'email', label: 'Email' },
      { value: 'tel', label: 'Phone' },
      { value: 'date', label: 'Date' },
      { value: 'number', label: 'Number' },
      { value: 'select', label: 'Drop-down' },
      { value: 'textarea', label: 'Long text' },
      { value: 'checkbox', label: 'Tick box (confirmation)' },
    ]),
    f.bool('required', 'Required'),
    f.bool('half', 'Half width (two per row)'),
    f.text('placeholder', 'Placeholder'),
    f.text('hint', 'Help text under the field'),
    f.textarea('options', 'Drop-down options (one per line)', 5),
    f.number('rows', 'Rows (long text)'),
  ],
  'Question',
);

type BuilderValues = Record<string, unknown> & { fields: Record<string, unknown>[] };

export function FormBuilder({ formKey, initial }: { formKey: string; initial: BuilderValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BuilderValues>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);

  async function save() {
    setSaving(true);
    const fields: FormField[] = values.fields.map((x) => ({
      name: String(x.name ?? '').trim(),
      label: String(x.label ?? ''),
      type: x.type as FormField['type'],
      required: !!x.required,
      half: !!x.half,
      placeholder: String(x.placeholder ?? '') || undefined,
      hint: String(x.hint ?? '') || undefined,
      options: x.type === 'select' ? String(x.options ?? '').split('\n').map((o) => o.trim()).filter(Boolean) : undefined,
      rows: x.type === 'textarea' && x.rows ? Number(x.rows) : undefined,
    }));
    const res = await saveFormDefinition(formKey, {
      name: String(values.name),
      submitLabel: String(values.submitLabel),
      successTitle: String(values.successTitle),
      successBody: String(values.successBody),
      note: String(values.note ?? '') || null,
      errorMessage: String(values.errorMessage),
      recipients: String(values.recipients ?? '').split(/[\n,]/).map((r) => r.trim()).filter(Boolean),
      autoReply: !!values.autoReply,
      autoReplySubject: String(values.autoReplySubject ?? ''),
      autoReplyBody: String(values.autoReplyBody ?? ''),
      fields,
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    setDirty(false);
    toast.success('Form saved — the website is updated.');
    router.refresh();
  }

  const onChange = (v: Record<string, unknown>) => {
    setValues(v as BuilderValues);
    setDirty(true);
  };

  return (
    <div className="pb-24">
      <Link href="/admin/forms" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Forms
      </Link>
      <h1 className="mb-6 text-[1.6rem] text-navy">{String(values.name)}</h1>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <FieldsEditor fields={[fieldList]} value={values} onChange={onChange} />
        </Card>
        <Card>
          <FieldsEditor fields={settingsFields} value={values} onChange={onChange} />
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm text-ink/60">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save form
          </Button>
        </div>
      </div>
    </div>
  );
}
