import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { formatFcfa } from '@/lib/sponsorship/format';
import { QuickForm } from '@/components/sponsorship/QuickForm';
import { Badge, Card, PageTitle } from '@/components/admin/ui';
import { saveSponsor } from '../_actions';
import { sponsorFields, sponsorStatusLabels } from './fields';

export default async function SponsorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePage('sponsorship');
  const { q } = await searchParams;
  const sponsors = await prisma.sponsor.findMany({
    where: q ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { organisation: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : undefined,
    orderBy: { fullName: 'asc' },
    include: { sponsorships: { where: { status: 'ACTIVE' } } },
  });
  await audit(user, 'view', 'sponsor-list');

  return (
    <>
      <PageTitle title="Sponsors" description="New sponsors can also be created from a “Become a sponsor” submission." />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search sponsors" aria-label="Search sponsors" className="h-10 w-full max-w-sm rounded-lg border border-navy/15 bg-white px-3 text-sm" />
      </form>
      <div className="overflow-x-auto rounded-xl border border-navy/[0.09] bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-mist/60 font-heading text-[0.72rem] text-navy">
            <tr>
              {['Name', 'Phone', 'Email', 'Country', 'Organisation', 'Children', 'Commitment', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.06]">
            {sponsors.map((s) => (
              <tr key={s.id} className="hover:bg-mist/40">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/sponsorship/sponsors/${s.id}`} className="font-semibold text-navy underline decoration-gold underline-offset-2">
                    {s.fullName}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{s.phone ?? '—'}</td>
                <td className="px-3 py-2.5">{s.email ?? '—'}</td>
                <td className="px-3 py-2.5">{s.country ?? '—'}</td>
                <td className="px-3 py-2.5">{s.organisation ?? '—'}</td>
                <td className="px-3 py-2.5">{s.sponsorships.length}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{formatFcfa(s.sponsorships.reduce((sum, x) => sum + (x.feesCommitted ?? 0), 0))}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={s.status === 'ACTIVE' ? 'green' : s.status === 'PROSPECT' ? 'gold' : 'muted'}>{sponsorStatusLabels[s.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sponsors.length === 0 && <p className="p-6 text-center text-sm text-ink/50">No sponsors yet.</p>}
      </div>
      <Card className="mt-4">
        <h2 className="mb-4 text-base text-navy">Add a sponsor</h2>
        <QuickForm fields={sponsorFields} initial={{ status: 'PROSPECT' }} submitLabel="Save sponsor" action={saveSponsor.bind(null, null)} />
      </Card>
    </>
  );
}
