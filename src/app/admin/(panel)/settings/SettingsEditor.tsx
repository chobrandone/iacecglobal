'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveSettings } from '@/app/admin/_actions/content';
import { FieldsEditor } from '@/components/admin/FieldEditor';
import { Button, Card, PageTitle } from '@/components/admin/ui';
import { useUnsavedWarning } from '@/components/admin/useUnsaved';
import { settingsFields } from '@/lib/settings-schema';
import { cn } from '@/lib/utils';

export function SettingsEditor({ initial }: { initial: Record<string, unknown> }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [tab, setTab] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);

  async function save() {
    setSaving(true);
    const res = await saveSettings(values);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    setDirty(false);
    toast.success('Settings saved — the website is updated.');
    router.refresh();
  }

  return (
    <div className="pb-24">
      <PageTitle title="Site settings" description="Logo, contact details, menus, footer, giving details and search settings." />
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {settingsFields.map((g, i) => (
          <button
            key={g.title}
            type="button"
            onClick={() => setTab(i)}
            className={cn('whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm', tab === i ? 'bg-navy text-white' : 'bg-white text-ink/70 hover:bg-navy/[0.05]')}
          >
            {g.title}
          </button>
        ))}
      </div>
      <Card>
        <FieldsEditor
          key={tab}
          fields={settingsFields[tab].fields}
          value={values}
          onChange={(v) => {
            setValues(v);
            setDirty(true);
          }}
        />
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm text-ink/60">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
