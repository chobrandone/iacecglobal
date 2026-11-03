import { Download } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { Button, Card, PageTitle } from '@/components/admin/ui';
import { DeleteSubscriber } from './DeleteSubscriber';

export default async function SubscribersPage() {
  await requirePage('subscribers');
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageTitle
        title="Newsletter subscribers"
        description={`${subs.length} people have joined the mailing list.`}
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page
          <a href="/api/admin/subscribers/export">
            <Button variant="outline">
              <Download className="h-4 w-4" /> Export CSV (Excel)
            </Button>
          </a>
        }
      />
      <Card className="overflow-hidden p-0">
        {subs.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">No subscribers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="hidden px-4 py-2 font-semibold sm:table-cell">Signed up from</th>
                <th className="hidden px-4 py-2 font-semibold sm:table-cell">Date</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/[0.06]">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="break-all px-4 py-2.5 text-navy">{s.email}</td>
                  <td className="hidden px-4 py-2.5 text-ink/60 sm:table-cell">{s.source}</td>
                  <td className="hidden px-4 py-2.5 text-ink/60 sm:table-cell">{s.createdAt.toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2.5 text-right">
                    <DeleteSubscriber id={s.id} email={s.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
