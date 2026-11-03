import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getArticle, getPage, getSettings } from '@/lib/content';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { Sections } from '@/sections/render';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const items = await prisma.newsArticle.findMany({ where: { published: true }, select: { slug: true } });
    return items.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [a, s] = await Promise.all([getArticle(slug), getSettings()]);
  if (!a) return {};
  return pageMetadata(s, { title: a.title, description: a.excerpt, path: `/news/${slug}`, image: a.coverImage, type: 'article' });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, template, s] = await Promise.all([getArticle(slug), getPage('templates/article'), getSettings()]);
  if (!article || !template) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(s, [
          { name: 'News', path: '/news' },
          { name: article.title, path: `/news/${slug}` },
        ])}
      />
      <Sections sections={template.sections} ctx={{ article }} />
    </>
  );
}
