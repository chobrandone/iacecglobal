'use client';

import { useId, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight, Copy, ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { emptyValue, type Field, type ImageValue, type LinkValue } from '@/lib/fields';
import { iconMap, iconNames } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { MediaPicker } from './MediaPicker';
import { SortableList } from './Sortable';
import { Button, Input, Label, Select, Switch, Textarea } from './ui';

const RichTextEditor = dynamic(() => import('./RichTextEditor').then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-[200px] rounded-lg border border-navy/15 bg-mist/50" />,
});

type Values = Record<string, unknown>;

/** Renders a friendly form for a list of field descriptors. */
export function FieldsEditor({ fields, value, onChange }: { fields: Field[]; value: Values; onChange: (v: Values) => void }) {
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldEditor key={field.name} field={field} value={value[field.name]} onChange={(v) => onChange({ ...value, [field.name]: v })} />
      ))}
    </div>
  );
}

export function FieldEditor({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId();
  const label = (
    <Label htmlFor={id} help={field.help}>
      {field.label}
      {field.required && <span className="ml-1 text-gold-deep">*</span>}
    </Label>
  );

  switch (field.kind) {
    case 'text':
      return (
        <div>
          {label}
          <Input id={id} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case 'textarea':
      return (
        <div>
          {label}
          <Textarea id={id} rows={field.rows ?? 3} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case 'richtext':
      return (
        <div>
          {label}
          <RichTextEditor id={id} value={String(value ?? '')} onChange={onChange} />
        </div>
      );
    case 'number':
      return (
        <div>
          {label}
          <Input id={id} type="number" value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className="max-w-[12rem]" />
        </div>
      );
    case 'date':
      return (
        <div>
          {label}
          <Input id={id} type="date" value={String(value ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} className="max-w-[14rem]" />
        </div>
      );
    case 'boolean':
      return <Switch id={id} checked={value === true} onChange={onChange} label={field.label} />;
    case 'select':
      return (
        <div>
          {label}
          <Select id={id} value={String(value ?? field.options[0]?.value ?? '')} onChange={onChange} options={field.options} />
        </div>
      );
    case 'icon':
      return (
        <div>
          {label}
          <IconSelect value={String(value ?? '')} onChange={onChange} />
        </div>
      );
    case 'link': {
      const v = (value as LinkValue) ?? { label: '', href: '' };
      return (
        <fieldset>
          <legend className="mb-1.5 font-heading text-[0.78rem] font-semibold text-navy">{field.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={`${field.label} text`} placeholder="Button text" value={v.label} onChange={(e) => onChange({ ...v, label: e.target.value })} />
            <Input aria-label={`${field.label} link`} placeholder="/page or https://…" value={v.href} onChange={(e) => onChange({ ...v, href: e.target.value })} />
          </div>
        </fieldset>
      );
    }
    case 'image':
      return (
        <div>
          {label}
          <ImageField value={(value as ImageValue) ?? { src: '', alt: '' }} onChange={onChange} />
        </div>
      );
    case 'imageUrl':
      return (
        <div>
          {label}
          <ImageField
            value={{ src: String(value ?? ''), alt: '' }}
            onChange={(v) => onChange(v.src)}
            withAlt={false}
          />
        </div>
      );
    case 'gallery':
      return (
        <div>
          {label}
          <GalleryField value={(value as ImageValue[]) ?? []} onChange={onChange} />
        </div>
      );
    case 'group':
      return (
        <fieldset className="rounded-xl border border-navy/10 p-4">
          <legend className="px-1 font-heading text-[0.78rem] font-semibold text-navy">{field.label}</legend>
          <FieldsEditor fields={field.fields} value={(value as Values) ?? {}} onChange={onChange} />
        </fieldset>
      );
    case 'list':
      return <ListField field={field} value={(value as Values[]) ?? []} onChange={onChange} />;
  }
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {iconNames.map((name) => {
        const Icon = iconMap[name];
        return (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', value === name ? 'border-gold bg-gold-tint text-gold-deep' : 'border-navy/10 text-ink/60 hover:border-navy/30')}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function ImageField({ value, onChange, withAlt = true }: { value: ImageValue; onChange: (v: ImageValue) => void; withAlt?: boolean }) {
  const [open, setOpen] = useState(false);
  const isImage = !!value.src && !/\.pdf($|\?)/i.test(value.src);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-28 w-full flex-none items-center justify-center overflow-hidden rounded-lg border border-dashed border-navy/20 bg-mist text-ink/50 hover:border-gold sm:w-44"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.src} alt="" className="h-full w-full object-cover" style={value.focal ? { objectPosition: value.focal } : undefined} />
        ) : value.src ? (
          <span className="px-2 text-xs">{value.src.split('/').pop()}</span>
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs">
            <ImageIcon className="h-5 w-5" />
            Choose image
          </span>
        )}
      </button>
      <div className="flex-1 space-y-2">
        {withAlt && (
          <Input placeholder="Describe the image for screen readers (alt text)" value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {value.src ? 'Change' : 'Choose'}
          </Button>
          {value.src && (
            <Button size="sm" variant="ghost" onClick={() => onChange({ src: '', alt: '' })}>
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker
        open={open}
        accept="image/*,application/pdf"
        onClose={() => setOpen(false)}
        onSelect={(m) => {
          onChange({ src: m.url, alt: value.alt || m.alt, focal: `${m.focalX}% ${m.focalY}%` });
          setOpen(false);
        }}
      />
    </div>
  );
}

function GalleryField({ value, onChange }: { value: ImageValue[]; onChange: (v: ImageValue[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((img, i) => (
          <div key={img.src + i} className="group relative h-20 w-28 overflow-hidden rounded-lg border border-navy/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded bg-white/90 p-0.5 text-red-600 opacity-0 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)} className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-navy/20 text-ink/50 hover:border-gold">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(m) => {
          onChange([...value, { src: m.url, alt: m.alt }]);
          setOpen(false);
        }}
      />
    </div>
  );
}

let keySeq = 0;
const withKey = (v: Values) => ({ ...v, __key: (v.__key as string) ?? `k${++keySeq}` });
const stripKey = ({ __key: _k, ...v }: Values) => v;

function ListField({ field, value, onChange }: { field: Extract<Field, { kind: 'list' }>; value: Values[]; onChange: (v: Values[]) => void }) {
  const [items, setItemsState] = useState<Values[]>(() => value.map(withKey));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const setItems = (next: Values[]) => {
    setItemsState(next);
    onChange(next.map(stripKey));
  };
  const titleOf = (item: Values, i: number) => {
    const first = field.fields.find((x) => ['text', 'textarea'].includes(x.kind));
    const t = first ? String(item[first.name] ?? '') : '';
    return t || `${field.itemLabel ?? 'Item'} ${i + 1}`;
  };

  return (
    <fieldset>
      <legend className="mb-1.5 font-heading text-[0.78rem] font-semibold text-navy">{field.label}</legend>
      {field.help && <p className="-mt-1 mb-2 text-xs text-ink/50">{field.help}</p>}
      <div className="space-y-2">
        <SortableList
          items={items}
          getId={(it) => it.__key as string}
          onReorder={setItems}
          renderItem={(item, handle, i) => {
            const key = item.__key as string;
            const isOpen = openKey === key;
            return (
              <div className="rounded-lg border border-navy/10 bg-white">
                <div className="flex items-center gap-1 px-2 py-1.5">
                  {handle}
                  <button type="button" onClick={() => setOpenKey(isOpen ? null : key)} className="flex flex-1 items-center gap-1.5 truncate text-left text-sm text-ink/80">
                    {isOpen ? <ChevronDown className="h-4 w-4 flex-none" /> : <ChevronRight className="h-4 w-4 flex-none" />}
                    <span className="truncate">{titleOf(item, i)}</span>
                  </button>
                  <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => setItems([...items.slice(0, i + 1), withKey({ ...stripKey(item), __key: undefined }), ...items.slice(i + 1)])}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
                {isOpen && (
                  <div className="border-t border-navy/10 p-3">
                    <FieldsEditor fields={field.fields} value={item} onChange={(v) => setItems(items.map((x, j) => (j === i ? { ...v, __key: key } : x)))} />
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => {
          const it = withKey(emptyValue(field.fields));
          setItems([...items, it]);
          setOpenKey(it.__key as string);
        }}
      >
        <Plus className="h-3.5 w-3.5" /> Add {field.itemLabel?.toLowerCase() ?? 'item'}
      </Button>
    </fieldset>
  );
}
