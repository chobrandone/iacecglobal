'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteCollectionItem, saveCollectionItem } from '@/app/admin/_actions/content';
import { FieldsEditor } from '@/components/admin/FieldEditor';
import { Button, Card } from '@/components/admin/ui';
import { useUnsavedWarning } from '@/components/admin/useUnsaved';
import { collectionMap } from '@/lib/collections';

const publicPath: Record<string, (v: Record<string, unknown>) => string | null> = {
  programmes: (v) => (v.slug ? `/programmes/${v.slug}` : null),
  news: (v) => (v.slug ? `/news/${v.slug}` : null),
};

export function ItemEditor({ collectionKey, id, initial }: { collectionKey: string; id: string | null; initial: Record<string, unknown> }) {
  const def = collectionMap[collectionKey];
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedWarning(dirty);
  const viewHref = id ? publicPath[collectionKey]?.(initial) : null;

  async function save() {
    setSaving(true);
    const res = await saveCollectionItem(collectionKey, id, values);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    setDirty(false);
    toast.success('Saved — the website is updated.');
    if (!id) router.replace(`/admin/collections/${collectionKey}/${res.data!.id}`);
    else router.refresh();
  }

  async function remove() {
    if (!id || !window.confirm(`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`)) return;
    const res = await deleteCollectionItem(collectionKey, id);
    if (!res.ok) return toast.error(res.error);
    setDirty(false);
    toast.success('Deleted');
    router.push(`/admin/collections/${collectionKey}`);
  }

  return (
    <div className="pb-24">
      <Link href={`/admin/collections/${collectionKey}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> {def.label}
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[1.6rem] text-navy">{id ? String(values[def.titleField] || def.singular) : `New ${def.singular.toLowerCase()}`}</h1>
        <div className="flex gap-2">
          {viewHref && (
            <a href={viewHref} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" /> View on site
              </Button>
            </a>
          )}
          {id && (
            <Button variant="ghost" onClick={remove}>
              <Trash2 className="h-4 w-4 text-red-600" /> Delete
            </Button>
          )}
        </div>
      </div>
      <Card>
        <FieldsEditor
          fields={def.fields}
          value={values}
          onChange={(v) => {
            setValues(v);
            setDirty(true);
          }}
        />
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm text-ink/60">{dirty ? 'You have unsaved changes.' : id ? 'All changes saved.' : 'Fill in the form and save.'}</p>
          <Button onClick={save} disabled={saving || (!dirty && !!id)}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
