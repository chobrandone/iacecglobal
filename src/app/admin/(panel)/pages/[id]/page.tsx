import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { PageEditor } from './PageEditor';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('content');
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id }, include: { sections: { orderBy: { order: 'asc' } } } });
  if (!page) notFound();
  return (
    <PageEditor
      key={page.updatedAt.toISOString()}
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        seoTitle: page.seoTitle ?? '',
        metaDescription: page.metaDescription ?? '',
        keywords: page.keywords ?? '',
        ogImage: page.ogImage ?? '',
        published: page.published,
        isTemplate: page.isTemplate,
      }}
      sections={page.sections.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        visible: s.visible,
        background: s.background as 'white' | 'mist' | 'navy',
        anchor: s.anchor,
        content: s.content as Record<string, unknown>,
      }))}
    />
  );
}
