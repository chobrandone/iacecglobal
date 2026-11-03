import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getPage, getProgramme, getSettings } from '@/lib/content';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { pillarLabels } from '@/components/site/Cards';
import { PageHero } from '@/sections/common';
import { Sections } from '@/sections/render';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const items = await prisma.programme.findMany({ where: { published: true }, select: { slug: true } });
    return items.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProgramme(slug), getSettings()]);
  if (!p) return {};
  return pageMetadata(s, { title: p.title, description: p.summary, path: `/programmes/${slug}`, image: p.coverImage });
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [programme, template, s] = await Promise.all([getProgramme(slug), getPage('templates/programme'), getSettings()]);
  if (!programme) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(s, [
          { name: 'Programmes', path: '/programmes' },
          { name: programme.title, path: `/programmes/${slug}` },
        ])}
      />
      <PageHero
        c={{
          variant: 'split',
          breadcrumb: programme.title,
          eyebrow: pillarLabels[programme.pillar] ?? 'Programme',
          heading: programme.title,
          body: programme.summary,
          image: { src: programme.coverImage ?? '', alt: programme.coverAlt || programme.title },
        }}
        bg="mist"
        ctx={{}}
      />
      {template && <Sections sections={template.sections} ctx={{ programme }} />}
    </>
  );
}
