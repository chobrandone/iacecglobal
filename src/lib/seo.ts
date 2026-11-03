import type { Metadata } from 'next';
import type { SiteSettings } from './settings-schema';

const FALLBACK_IMAGE = '/media/brand/iacec-logo-full.png';

export function siteBase(s: SiteSettings) {
  return (process.env.NEXT_PUBLIC_SITE_URL || s.siteUrl || 'https://iacecglobal.com').replace(/\/$/, '');
}

/** Builds page metadata the same way the live site does: "<title> — IACEC", canonical on iacecglobal.com. */
export function pageMetadata(
  s: SiteSettings,
  {
    title,
    description,
    keywords,
    path,
    image,
    type = 'website',
  }: { title?: string | null; description?: string | null; keywords?: string | null; path: string; image?: string | null; type?: 'website' | 'article' },
): Metadata {
  const fullTitle = title ? `${title}${s.titleSuffix}` : s.defaultTitle;
  const desc = description || s.defaultDescription;
  const img = image || s.ogImage?.src || FALLBACK_IMAGE;
  return {
    title: { absolute: fullTitle },
    description: desc,
    keywords: keywords || s.defaultKeywords || undefined,
    alternates: { canonical: path },
    openGraph: { type, siteName: s.organisationName, title: fullTitle, description: desc, url: path, images: [{ url: img }] },
    twitter: { card: 'summary_large_image', title: fullTitle, description: desc, images: [img] },
  };
}

/** schema.org data describing the organisation, which Google uses for its name, logo and contact details. */
export function organisationJsonLd(s: SiteSettings) {
  const base = siteBase(s);
  const socials = [s.facebookUrl, s.instagramUrl, s.youtubeUrl, s.linkedinUrl].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NGO',
        '@id': `${base}/#organization`,
        name: s.organisationName,
        alternateName: s.siteName,
        url: base,
        logo: `${base}${FALLBACK_IMAGE}`,
        description: s.defaultDescription,
        email: s.email,
        telephone: s.phones[0]?.number,
        address: { '@type': 'PostalAddress', streetAddress: s.addressLine || undefined, addressLocality: s.city, addressCountry: s.country },
        sameAs: socials.length ? socials : undefined,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: s.organisationName,
        alternateName: s.siteName,
        url: base,
        publisher: { '@id': `${base}/#organization` },
      },
    ],
  };
}

/** Breadcrumb trail, shown by Google in place of the raw web address. */
export function breadcrumbJsonLd(s: SiteSettings, trail: { name: string; path: string }[]) {
  const base = siteBase(s);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '' }, ...trail].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
