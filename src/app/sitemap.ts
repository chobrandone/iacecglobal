import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const revalidate = 3600;

const PRIORITY: Record<string, number> = { '': 1, about: 0.9, programmes: 0.9, educators: 0.9, 'community-support': 0.9, donate: 0.8, contact: 0.8, news: 0.8, 'privacy-policy': 0.2 };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://iacecglobal.com').replace(/\/$/, '');
  try {
    const [pages, programmes, articles] = await Promise.all([
      prisma.page.findMany({ where: { published: true, isTemplate: false }, select: { slug: true, updatedAt: true } }),
      prisma.programme.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.newsArticle.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...pages.map((p) => ({
        url: p.slug ? `${base}/${p.slug}` : base,
        lastModified: p.updatedAt,
        changeFrequency: p.slug === 'news' || p.slug === 'events' ? ('weekly' as const) : ('monthly' as const),
        priority: PRIORITY[p.slug] ?? 0.7,
      })),
      ...programmes.map((p) => ({ url: `${base}/programmes/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.8 })),
      ...articles.map((a) => ({ url: `${base}/news/${a.slug}`, lastModified: a.updatedAt, changeFrequency: 'yearly' as const, priority: 0.6 })),
    ];
  } catch {
    return [{ url: base }];
  }
}
