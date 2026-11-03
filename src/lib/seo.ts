import type { Metadata } from 'next';
import type { SiteSettings } from './settings-schema';

/** Builds page metadata the same way the live site does: "<title> — IACEC", canonical on iacecglobal.com. */
export function pageMetadata(
  s: SiteSettings,
  { title, description, path, image }: { title?: string | null; description?: string | null; path: string; image?: string | null },
): Metadata {
  const fullTitle = title ? `${title}${s.titleSuffix}` : s.defaultTitle;
  const desc = description || s.defaultDescription;
  const img = image || s.ogImage?.src || undefined;
  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description: desc, url: path, images: img ? [{ url: img }] : undefined },
    twitter: { card: 'summary_large_image', title: fullTitle, description: desc, images: img ? [img] : undefined },
  };
}
