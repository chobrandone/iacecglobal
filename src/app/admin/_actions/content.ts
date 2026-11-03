'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { collectionMap } from '@/lib/collections';
import { objectSchema, type Field } from '@/lib/fields';
import { logActivity, requireCapability } from '@/lib/permissions';
import { cleanHtml } from '@/lib/sanitize';
import { settingsFields, settingsSchema } from '@/lib/settings-schema';
import { slugify } from '@/lib/utils';
import { sectionDefinitionMap } from '@/sections/definitions';

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/** Every public page reads from the database, so one layout-level revalidation refreshes the site. */
function refreshSite() {
  revalidatePath('/', 'layout');
}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues.map((i) => i.message).join(' · ') };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
    return { ok: false, error: 'That web address (slug) is already in use.' };
  return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
}

/** Walks content and sanitises every rich-text field according to its definition. */
function sanitizeContent(fields: Field[], value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...value };
  for (const field of fields) {
    const v = out[field.name];
    if (field.kind === 'richtext' && typeof v === 'string') out[field.name] = cleanHtml(v);
    if (field.kind === 'list' && Array.isArray(v)) out[field.name] = v.map((item) => sanitizeContent(field.fields, item ?? {}));
    if (field.kind === 'group' && v && typeof v === 'object') out[field.name] = sanitizeContent(field.fields, v as Record<string, unknown>);
  }
  return out;
}

// ─── Pages ──────────────────────────────────────────────────────────────

const sectionInput = z.object({
  id: z.string().optional(),
  type: z.string(),
  label: z.string().nullable().optional(),
  visible: z.boolean(),
  background: z.enum(['white', 'mist', 'navy']),
  anchor: z.string().nullable().optional(),
  content: z.record(z.unknown()),
});

const pageInput = z.object({
  title: z.string().min(1, 'The page needs a title.'),
  slug: z
    .string()
    .regex(/^[a-z0-9/-]*$/, 'The web address may only use lowercase letters, numbers, hyphens and slashes.')
    .transform((s) => s.replace(/^\/+|\/+$/g, '')),
  seoTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  published: z.boolean(),
  sections: z.array(sectionInput),
});

export async function savePage(pageId: string, input: z.infer<typeof pageInput>): Promise<ActionResult> {
  try {
    const user = await requireCapability('content');
    const data = pageInput.parse(input);
    const existing = await prisma.page.findUniqueOrThrow({ where: { id: pageId }, include: { sections: true } });

    const sections = data.sections.map((s, order) => {
      const def = sectionDefinitionMap[s.type];
      if (!def) throw new Error(`Unknown section type "${s.type}".`);
      const parsed = objectSchema(def.fields).parse(s.content);
      return { ...s, order, content: sanitizeContent(def.fields, parsed) as Prisma.InputJsonValue };
    });

    const keepIds = sections.map((s) => s.id).filter((id): id is string => !!id && existing.sections.some((e) => e.id === id));

    await prisma.$transaction([
      prisma.page.update({
        where: { id: pageId },
        data: {
          title: data.title,
          slug: existing.isTemplate ? existing.slug : data.slug,
          seoTitle: data.seoTitle || null,
          metaDescription: data.metaDescription || null,
          ogImage: data.ogImage || null,
          published: data.published,
        },
      }),
      prisma.section.deleteMany({ where: { pageId, id: { notIn: keepIds } } }),
      ...sections.map((s) =>
        s.id && keepIds.includes(s.id)
          ? prisma.section.update({
              where: { id: s.id },
              data: { type: s.type, label: s.label, visible: s.visible, background: s.background, anchor: s.anchor || null, order: s.order, content: s.content },
            })
          : prisma.section.create({
              data: { pageId, type: s.type, label: s.label, visible: s.visible, background: s.background, anchor: s.anchor || null, order: s.order, content: s.content },
            }),
      ),
    ]);
    await logActivity(user.id, 'updated', 'page', pageId, data.title);
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createPage(input: { title: string; slug: string }): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCapability('content');
    const title = z.string().min(1, 'The page needs a title.').parse(input.title);
    const slug = slugify(input.slug || title);
    if (!slug) throw new Error('Please give the page a web address.');
    const page = await prisma.page.create({
      data: {
        title,
        slug,
        seoTitle: title,
        published: false,
        sections: {
          create: [
            {
              type: 'pageHero',
              order: 0,
              background: 'mist',
              content: { variant: 'split', breadcrumb: title, eyebrow: '', heading: title, body: '', image: { src: '', alt: '' } },
            },
          ],
        },
      },
    });
    await logActivity(user.id, 'created', 'page', page.id, title);
    return { ok: true, data: { id: page.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePage(pageId: string): Promise<ActionResult> {
  try {
    const user = await requireCapability('content');
    const page = await prisma.page.findUniqueOrThrow({ where: { id: pageId } });
    if (page.isTemplate || page.slug === '') throw new Error('This page is part of the site structure and cannot be deleted.');
    await prisma.page.delete({ where: { id: pageId } });
    await logActivity(user.id, 'deleted', 'page', pageId, page.title);
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Collections ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = any;
const delegate = (model: string): Delegate => (prisma as unknown as Record<string, Delegate>)[model];

function toColumns(fields: Field[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const v = values[field.name];
    switch (field.kind) {
      case 'richtext':
        out[field.name] = cleanHtml(String(v ?? ''));
        break;
      case 'boolean':
        out[field.name] = v === true;
        break;
      case 'number':
        out[field.name] = v === '' || v === null || v === undefined ? null : Math.round(Number(v));
        break;
      case 'date':
        out[field.name] = v ? new Date(String(v)) : new Date();
        break;
      case 'gallery':
        out[field.name] = (Array.isArray(v) ? v : []) as Prisma.InputJsonValue;
        break;
      default:
        out[field.name] = typeof v === 'string' ? v.trim() || (field.required ? '' : null) : (v ?? null);
    }
  }
  return out;
}

export async function saveCollectionItem(key: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCapability('content');
    const def = collectionMap[key];
    if (!def) throw new Error('Unknown collection.');
    objectSchema(def.fields.filter((f) => f.required)).parse(values);
    const data = toColumns(def.fields, values);
    if (def.slugFrom) data.slug = slugify(String(data.slug || data[def.slugFrom] || ''));
    // Required text columns must not be null
    for (const field of def.fields) if (data[field.name] === null && ['text', 'textarea', 'richtext'].includes(field.kind)) data[field.name] = '';
    for (const nullable of ['slug']) if (data[nullable] === '') delete data[nullable];

    const model = delegate(def.model);
    let saved: { id: string };
    if (id) saved = await model.update({ where: { id }, data });
    else {
      if (def.orderField) {
        const last = await model.aggregate({ _max: { [def.orderField]: true } });
        data[def.orderField] = ((last._max?.[def.orderField] as number | null) ?? -1) + 1;
      }
      saved = await model.create({ data });
    }
    await logActivity(user.id, id ? 'updated' : 'created', def.singular, saved.id, String(values[def.titleField] ?? ''));
    refreshSite();
    return { ok: true, data: { id: saved.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCollectionItem(key: string, id: string): Promise<ActionResult> {
  try {
    const user = await requireCapability('content');
    const def = collectionMap[key];
    if (!def) throw new Error('Unknown collection.');
    await delegate(def.model).delete({ where: { id } });
    await logActivity(user.id, 'deleted', def.singular, id);
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderCollection(key: string, ids: string[]): Promise<ActionResult> {
  try {
    await requireCapability('content');
    const def = collectionMap[key];
    if (!def?.orderField) throw new Error('This collection cannot be reordered.');
    const model = delegate(def.model);
    await prisma.$transaction(ids.map((id, i) => model.update({ where: { id }, data: { [def.orderField!]: i } })));
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function togglePublished(key: string, id: string, value: boolean): Promise<ActionResult> {
  try {
    await requireCapability('content');
    const def = collectionMap[key];
    if (!def?.publishedField) throw new Error('This collection has no published switch.');
    await delegate(def.model).update({ where: { id }, data: { [def.publishedField]: value } });
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Settings ───────────────────────────────────────────────────────────

export async function saveSettings(values: Record<string, unknown>): Promise<ActionResult> {
  try {
    const user = await requireCapability('settings');
    const parsed = settingsSchema.parse(values);
    const data = sanitizeContent(
      settingsFields.flatMap((g) => g.fields),
      parsed,
    ) as Prisma.InputJsonValue;
    await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } });
    await logActivity(user.id, 'updated', 'settings');
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
