import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { Badge, Card, PageTitle } from '@/components/admin/ui';
import { NewPageButton } from './NewPageButton';

export default async function PagesList() {
  await requirePage('content');
  const pages = await prisma.page.findMany({ orderBy: [{ isTemplate: 'asc' }, { slug: 'asc' }], include: { _count: { select: { sections: true } } } });
  return (
    <>
      <PageTitle title="Pages" description="Every page of the website. Open one to edit its sections." actions={<NewPageButton />} />
      <Card className="p-0">
        <ul className="divide-y divide-navy/[0.06]">
          {pages.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/pages/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-mist/60">
                <span>
                  <span className="block font-semibold text-navy">{p.title}</span>
                  <span className="text-xs text-ink/50">{p.isTemplate ? 'Template for detail pages' : `/${p.slug}`}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink/45">{p._count.sections} sections</span>
                  {p.isTemplate ? <Badge tone="gold">Template</Badge> : p.published ? <Badge tone="green">Published</Badge> : <Badge tone="muted">Draft</Badge>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
