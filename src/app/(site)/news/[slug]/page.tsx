import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getArticle, getPage, getSettings } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
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
  return pageMetadata(s, { title: a.title, description: a.excerpt, path: `/news/${slug}`, image: a.coverImage });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, template] = await Promise.all([getArticle(slug), getPage('templates/article')]);
  if (!article || !template) notFound();
  return <Sections sections={template.sections} ctx={{ article }} />;
}
