import Link from 'next/link';
import { prisma } from '@/lib/db';
import { can, readableFormKeys, requirePage } from '@/lib/permissions';
import { Card, PageTitle } from '@/components/admin/ui';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePage();
  const { denied } = await searchParams;
  const keys = await readableFormKeys(user.role);
  const [forms, counts, activity, subscribers] = await Promise.all([
    prisma.formDefinition.findMany({ where: { key: { in: keys } }, select: { key: true, name: true } }),
    prisma.submission.groupBy({ by: ['formKey'], where: { formKey: { in: keys }, status: 'NEW' }, _count: true }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 12, include: { user: { select: { name: true } } } }),
    can(user.role, 'subscribers') ? prisma.subscriber.count() : Promise.resolve(null),
  ]);
  const countFor = (key: string) => counts.find((c) => c.formKey === key)?._count ?? 0;

  const quick = [
    can(user.role, 'content') && { href: '/admin/pages', label: 'Edit a page' },
    can(user.role, 'content') && { href: '/admin/collections/news/new', label: 'Write a news article' },
    can(user.role, 'content') && { href: '/admin/collections/events/new', label: 'Add an event' },
    can(user.role, 'media') && { href: '/admin/media', label: 'Upload photos' },
    can(user.role, 'settings') && { href: '/admin/settings', label: 'Contact details & menus' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <PageTitle title={`Welcome, ${user.name.split(' ')[0]}`} description="Here is what is happening on the website." />
      {denied && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">You do not have access to that area.</p>}

      {forms.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base text-navy">New submissions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((f) => (
              <Link key={f.key} href={`/admin/submissions?form=${f.key}&status=NEW`}>
                <Card className="transition hover:border-gold/50">
                  <p className="text-sm text-ink/60">{f.name}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-navy">{countFor(f.key)}</p>
                </Card>
              </Link>
            ))}
            {subscribers !== null && (
              <Link href="/admin/subscribers">
                <Card className="transition hover:border-gold/50">
                  <p className="text-sm text-ink/60">Newsletter subscribers</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-navy">{subscribers}</p>
                </Card>
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {quick.length > 0 && (
          <Card>
            <h2 className="mb-3 text-base text-navy">Quick links</h2>
            <ul className="space-y-1">
              {quick.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className="block rounded-lg px-3 py-2 text-sm text-navy hover:bg-mist">
                    {q.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <h2 className="mb-3 text-base text-navy">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-ink/50">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-navy/[0.06] text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-2">
                  <span>
                    <strong className="font-semibold text-navy">{a.user?.name ?? 'Someone'}</strong> {a.action} {a.entity}
                    {a.label ? <span className="text-ink/60"> — {a.label}</span> : null}
                  </span>
                  <time className="flex-none text-xs text-ink/45">{a.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
