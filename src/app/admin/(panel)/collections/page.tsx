import Link from 'next/link';
import { prisma } from '@/lib/db';
import { collections } from '@/lib/collections';
import { requirePage } from '@/lib/permissions';
import { Card, PageTitle } from '@/components/admin/ui';

export default async function CollectionsIndex() {
  await requirePage('content');
  const counts = await Promise.all(
    collections.map((c) => (prisma as unknown as Record<string, { count: () => Promise<number> }>)[c.model].count()),
  );
  return (
    <>
      <PageTitle title="Collections" description="Lists of items that appear across the website." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Link key={c.key} href={`/admin/collections/${c.key}`}>
            <Card className="h-full transition hover:border-gold/50">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base text-navy">{c.label}</h2>
                <span className="font-heading text-sm font-bold text-gold-deep">{counts[i]}</span>
              </div>
              <p className="mt-1 text-sm text-ink/60">{c.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
