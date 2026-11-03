import { z, type ZodTypeAny } from 'zod';

/**
 * Field descriptors drive both the admin editing forms and the Zod validation of
 * stored JSON content (sections, site settings). One description, two uses.
 */
export type FieldBase = {
  name: string;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
};

export type Field =
  | (FieldBase & { kind: 'text' })
  | (FieldBase & { kind: 'textarea'; rows?: number })
  | (FieldBase & { kind: 'richtext' })
  | (FieldBase & { kind: 'image' })
  | (FieldBase & { kind: 'imageUrl' })
  | (FieldBase & { kind: 'gallery' })
  | (FieldBase & { kind: 'date'; withTime?: boolean })
  | (FieldBase & { kind: 'link' })
  | (FieldBase & { kind: 'icon' })
  | (FieldBase & { kind: 'number' })
  | (FieldBase & { kind: 'boolean' })
  | (FieldBase & { kind: 'select'; options: { value: string; label: string }[] })
  | (FieldBase & { kind: 'list'; fields: Field[]; itemLabel?: string })
  | (FieldBase & { kind: 'group'; fields: Field[] });

export type ImageValue = { src: string; alt: string; focal?: string };
export type LinkValue = { label: string; href: string };

export const imageSchema = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  focal: z.string().optional(),
});
export const linkSchema = z.object({ label: z.string().default(''), href: z.string().default('') });

export function fieldSchema(field: Field): ZodTypeAny {
  switch (field.kind) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'icon':
      return field.required ? z.string().min(1, `${field.label} is required`) : z.string().default('');
    case 'imageUrl':
    case 'date':
      return z.string().default('');
    case 'gallery':
      return z.array(imageSchema).default([]);
    case 'select':
      return z.string().default(field.options[0]?.value ?? '');
    case 'number':
      return z.coerce.number().default(0);
    case 'boolean':
      return z.boolean().default(false);
    case 'image':
      return imageSchema.default({ src: '', alt: '' });
    case 'link':
      return linkSchema.default({ label: '', href: '' });
    case 'list':
      return z.array(objectSchema(field.fields)).default([]);
    case 'group':
      return objectSchema(field.fields).default({});
  }
}

export function objectSchema(fields: Field[]) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f);
  return z.object(shape).passthrough();
}

/** Builds an empty value for a set of fields (used when adding list items / new sections). */
export function emptyValue(fields: Field[]): Record<string, unknown> {
  return objectSchema(fields).parse({});
}

// Shorthand builders keep the section definitions readable.
export const f = {
  text: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'text', name, label, ...extra }),
  textarea: (name: string, label: string, rows = 3, extra: Partial<FieldBase> = {}): Field => ({
    kind: 'textarea',
    name,
    label,
    rows,
    ...extra,
  }),
  rich: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'richtext', name, label, ...extra }),
  image: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'image', name, label, ...extra }),
  link: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'link', name, label, ...extra }),
  icon: (name: string, label: string): Field => ({ kind: 'icon', name, label }),
  imageUrl: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'imageUrl', name, label, ...extra }),
  gallery: (name: string, label: string): Field => ({ kind: 'gallery', name, label }),
  date: (name: string, label: string, withTime = false, extra: Partial<FieldBase> = {}): Field => ({ kind: 'date', name, label, withTime, ...extra }),
  number: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'number', name, label, ...extra }),
  bool: (name: string, label: string, extra: Partial<FieldBase> = {}): Field => ({ kind: 'boolean', name, label, ...extra }),
  select: (name: string, label: string, options: (string | { value: string; label: string })[], extra: Partial<FieldBase> = {}): Field => ({
    kind: 'select',
    name,
    label,
    options: options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    ...extra,
  }),
  list: (name: string, label: string, fields: Field[], itemLabel?: string, extra: Partial<FieldBase> = {}): Field => ({
    kind: 'list',
    name,
    label,
    fields,
    itemLabel,
    ...extra,
  }),
  group: (name: string, label: string, fields: Field[]): Field => ({ kind: 'group', name, label, fields }),
};
