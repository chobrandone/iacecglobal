import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://iacecglobal.com').replace(/\/$/, '');
  try {
    const [pages, programmes, articles] = await Promise.all([
      prisma.page.findMany({ where: { published: true, isTemplate: false }, select: { slug: true, updatedAt: true } }),
      prisma.programme.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.newsArticle.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...pages.map((p) => ({ url: `${base}/${p.slug}`.replace(/\/$/, '') || base, lastModified: p.updatedAt })),
      ...programmes.map((p) => ({ url: `${base}/programmes/${p.slug}`, lastModified: p.updatedAt })),
      ...articles.map((a) => ({ url: `${base}/news/${a.slug}`, lastModified: a.updatedAt })),
    ];
  } catch {
    return [{ url: base }];
  }
}
