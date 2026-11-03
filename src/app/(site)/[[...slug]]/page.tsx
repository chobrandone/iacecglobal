import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getPage, getSettings } from '@/lib/content';
import { JsonLd } from '@/components/site/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { Sections } from '@/sections/render';

export const revalidate = 3600;

type Params = { slug?: string[] };

const toSlug = (parts?: string[]) => (parts ?? []).join('/');

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const pages = await prisma.page.findMany({ where: { published: true, isTemplate: false }, select: { slug: true } });
    return pages.map((p) => ({ slug: p.slug ? p.slug.split('/') : [] }));
  } catch {
    return []; // No database at build time: pages render on first request instead.
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const slug = toSlug((await params).slug);
  const [page, s] = await Promise.all([getPage(slug), getSettings()]);
  if (!page || page.isTemplate) return {};
  return pageMetadata(s, {
    title: page.seoTitle || page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    path: slug ? `/${slug}` : '/',
    image: page.ogImage,
  });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const slug = toSlug((await params).slug);
  const [page, s] = await Promise.all([getPage(slug), getSettings()]);
  if (!page || !page.published || page.isTemplate) notFound();
  return (
    <>
      {slug && <JsonLd data={breadcrumbJsonLd(s, [{ name: page.title, path: `/${slug}` }])} />}
      <Sections sections={page.sections} />
    </>
  );
}
