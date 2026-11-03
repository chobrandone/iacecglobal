'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, ExternalLink, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deletePage, savePage } from '@/app/admin/_actions/content';
import { FieldEditor, FieldsEditor } from '@/components/admin/FieldEditor';
import { SortableList } from '@/components/admin/Sortable';
import { Badge, Button, Card, Dialog, Input, Label, Select, Switch, Textarea } from '@/components/admin/ui';
import { useUnsavedWarning } from '@/components/admin/useUnsaved';
import { emptyValue } from '@/lib/fields';
import { cn } from '@/lib/utils';
import { sectionDefinitionMap, sectionDefinitions } from '@/sections/definitions';

type Bg = 'white' | 'mist' | 'navy';
type EditableSection = {
  key: string;
  id?: string;
  type: string;
  label: string | null;
  visible: boolean;
  background: Bg;
  anchor: string | null;
  content: Record<string, unknown>;
};
type PageMeta = {
  id: string;
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  ogImage: string;
  published: boolean;
  isTemplate: boolean;
};

let seq = 0;

export function PageEditor({ page, sections: initial }: { page: PageMeta; sections: Omit<EditableSection, 'key'>[] }) {
  const router = useRouter();
  const [meta, setMeta] = useState(page);
  const [sections, setSections] = useState<EditableSection[]>(() => initial.map((s) => ({ ...s, key: s.id! })));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedWarning(dirty);

  const publicPath = page.isTemplate ? null : `/${meta.slug}`;
  const addable = useMemo(() => sectionDefinitions.filter((d) => (page.isTemplate ? true : !d.templateOnly)), [page.isTemplate]);

  const update = (key: string, patch: Partial<EditableSection>) => {
    setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    const res = await savePage(page.id, {
      title: meta.title,
      slug: meta.slug,
      seoTitle: meta.seoTitle,
      metaDescription: meta.metaDescription,
      ogImage: meta.ogImage,
      published: meta.published,
      sections: sections.map(({ key: _key, ...s }) => s),
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    setDirty(false);
    toast.success('Saved — the website is updated.');
    router.refresh();
  }

  async function remove() {
    if (!window.confirm('Delete this page? This cannot be undone.')) return;
    const res = await deletePage(page.id);
    if (!res.ok) return toast.error(res.error);
    toast.success('Page deleted');
    router.push('/admin/pages');
  }

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">{page.isTemplate ? 'Template' : 'Page'}</p>
          <h1 className="text-[1.6rem] text-navy">{meta.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicPath !== null && (
            <a href={publicPath || '/'} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" /> View page
              </Button>
            </a>
          )}
          {!page.isTemplate && page.slug !== '' && (
            <Button variant="ghost" onClick={remove}>
              <Trash2 className="h-4 w-4 text-red-600" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <SortableList
            items={sections}
            getId={(s) => s.key}
            onReorder={(next) => {
              setSections(next);
              setDirty(true);
            }}
            renderItem={(s, handle, index) => {
              const def = sectionDefinitionMap[s.type];
              const isOpen = openKey === s.key;
              const heading = (s.content.heading as string) || (s.content.line1 as string) || def?.description || '';
              return (
                <Card className={cn('p-0', !s.visible && 'opacity-60')}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    {handle}
                    <button type="button" onClick={() => setOpenKey(isOpen ? null : s.key)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      {isOpen ? <ChevronDown className="h-4 w-4 flex-none text-ink/50" /> : <ChevronRight className="h-4 w-4 flex-none text-ink/50" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy">
                          {index + 1}. {s.label || def?.label || s.type}
                        </span>
                        <span className="block truncate text-xs text-ink/50">{heading}</span>
                      </span>
                    </button>
                    {!s.visible && <Badge tone="muted">Hidden</Badge>}
                    <Button size="icon" variant="ghost" aria-label={s.visible ? 'Hide section' : 'Show section'} title={s.visible ? 'Hide' : 'Show'} onClick={() => update(s.key, { visible: !s.visible })}>
                      {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Duplicate section"
                      title="Duplicate"
                      onClick={() => {
                        const copy = { ...structuredClone(s), id: undefined, key: `new-${++seq}` };
                        setSections((list) => [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
                        setDirty(true);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete section"
                      title="Delete"
                      onClick={() => {
                        if (!window.confirm('Remove this section from the page?')) return;
                        setSections((list) => list.filter((x) => x.key !== s.key));
                        setDirty(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  {isOpen && def && (
                    <div className="space-y-5 border-t border-navy/10 p-4">
                      <div className="grid gap-3 rounded-lg bg-mist/70 p-3 sm:grid-cols-3">
                        <div>
                          <Label htmlFor={`${s.key}-label`}>Name in admin</Label>
                          <Input id={`${s.key}-label`} value={s.label ?? ''} placeholder={def.label} onChange={(e) => update(s.key, { label: e.target.value })} />
                        </div>
                        {def.backgrounds && (
                          <div>
                            <Label htmlFor={`${s.key}-bg`}>Background</Label>
                            <Select
                              id={`${s.key}-bg`}
                              value={s.background}
                              onChange={(v) => update(s.key, { background: v as Bg })}
                              options={[
                                { value: 'white', label: 'White' },
                                { value: 'mist', label: 'Pale grey-blue' },
                                { value: 'navy', label: 'Navy' },
                              ]}
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor={`${s.key}-anchor`} help="For links like /page#anchor">
                            Anchor
                          </Label>
                          <Input id={`${s.key}-anchor`} value={s.anchor ?? ''} onChange={(e) => update(s.key, { anchor: e.target.value })} />
                        </div>
                      </div>
                      <FieldsEditor fields={def.fields} value={s.content} onChange={(content) => update(s.key, { content })} />
                    </div>
                  )}
                </Card>
              );
            }}
          />
          <Button variant="outline" onClick={() => setAdding(true)} className="w-full border-dashed">
            <Plus className="h-4 w-4" /> Add a section
          </Button>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-sm text-navy">Page details</h2>
            <div>
              <Label htmlFor="pg-title">Title</Label>
              <Input id="pg-title" value={meta.title} onChange={(e) => (setMeta({ ...meta, title: e.target.value }), setDirty(true))} />
            </div>
            {!page.isTemplate && (
              <div>
                <Label htmlFor="pg-slug" help={page.slug === '' ? 'The home page address cannot change.' : undefined}>
                  Web address
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-ink/50">/</span>
                  <Input id="pg-slug" value={meta.slug} disabled={page.slug === ''} onChange={(e) => (setMeta({ ...meta, slug: e.target.value }), setDirty(true))} />
                </div>
              </div>
            )}
            {!page.isTemplate && (
              <Switch checked={meta.published} onChange={(v) => (setMeta({ ...meta, published: v }), setDirty(true))} label="Published" />
            )}
          </Card>
          {!page.isTemplate && (
            <Card className="space-y-4">
              <h2 className="text-sm text-navy">Search & sharing</h2>
              <div>
                <Label htmlFor="pg-seo" help="Shown in browser tabs and Google. “ — IACEC” is added automatically.">
                  SEO title
                </Label>
                <Input id="pg-seo" value={meta.seoTitle} onChange={(e) => (setMeta({ ...meta, seoTitle: e.target.value }), setDirty(true))} />
              </div>
              <div>
                <Label htmlFor="pg-desc">Meta description</Label>
                <Textarea id="pg-desc" rows={4} value={meta.metaDescription} onChange={(e) => (setMeta({ ...meta, metaDescription: e.target.value }), setDirty(true))} />
              </div>
              <FieldEditor
                field={{ kind: 'imageUrl', name: 'ogImage', label: 'Social sharing image' }}
                value={meta.ogImage}
                onChange={(v) => (setMeta({ ...meta, ogImage: String(v ?? '') }), setDirty(true))}
              />
            </Card>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm text-ink/60">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add a section" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {addable.map((d) => (
            <button
              key={d.type}
              type="button"
              onClick={() => {
                const key = `new-${++seq}`;
                setSections((list) => [
                  ...list,
                  { key, type: d.type, label: null, visible: true, background: d.type === 'ctaBand' ? 'navy' : 'white', anchor: null, content: emptyValue(d.fields) },
                ]);
                setOpenKey(key);
                setAdding(false);
                setDirty(true);
              }}
              className="rounded-lg border border-navy/10 p-3 text-left hover:border-gold hover:bg-gold-tint/40"
            >
              <span className="block text-sm font-semibold text-navy">{d.label}</span>
              <span className="mt-0.5 block text-xs text-ink/60">{d.description}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
