import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { formatDate, formatFcfa } from '@/lib/sponsorship/format';
import { QuickForm } from '@/components/sponsorship/QuickForm';
import { Badge, Card, PageTitle } from '@/components/admin/ui';
import { addSponsorReport, saveSponsor } from '../../_actions';
import { sponsorFields } from '../fields';

export default async function SponsorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('sponsorship');
  const { id } = await params;
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: {
      reports: { orderBy: { createdAt: 'desc' } },
      sponsorships: { orderBy: { startDate: 'desc' }, include: { child: { select: { id: true, fullName: true, applicationId: true } } } },
    },
  });
  if (!sponsor) notFound();
  const payments = await prisma.feePayment.findMany({
    where: { schoolRecord: { applicationId: { in: sponsor.sponsorships.map((s) => s.child.applicationId) } } },
    orderBy: { paidAt: 'desc' },
    include: { schoolRecord: { select: { schoolYear: true, application: { select: { child: { select: { fullName: true } } } } } } },
  });
  await audit(user, 'view', 'sponsor', id);

  const children = sponsor.sponsorships.map((s) => ({ value: s.child.id, label: s.child.fullName }));
  const childName = (childId: string | null) => children.find((c) => c.value === childId)?.label;

  return (
    <>
      <Link href="/admin/sponsorship/sponsors" className="mb-3 inline-flex items-center gap-1 text-sm text-ink/60 hover:text-navy">
        <ChevronLeft className="h-4 w-4" /> Sponsors
      </Link>
      <PageTitle title={sponsor.fullName} description={sponsor.organisation ?? undefined} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base text-navy">Details</h2>
          <QuickForm
            keep
            fields={sponsorFields}
            submitLabel="Save sponsor"
            initial={{ fullName: sponsor.fullName, organisation: sponsor.organisation ?? '', phone: sponsor.phone ?? '', email: sponsor.email ?? '', country: sponsor.country ?? '', status: sponsor.status }}
            action={saveSponsor.bind(null, id)}
          />
        </Card>
        <Card>
          <h2 className="text-base text-navy">Children</h2>
          {sponsor.sponsorships.length === 0 ? (
            <p className="mt-2 text-sm text-ink/50">No children yet. Assign a sponsor on the child’s Sponsor tab.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {sponsor.sponsorships.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/sponsorship/applications/${s.child.applicationId}?tab=sponsor`} className="text-navy underline decoration-gold underline-offset-2">
                    {s.child.fullName}
                  </Link>
                  <Badge tone={s.status === 'ACTIVE' ? 'green' : 'muted'}>{s.status.toLowerCase()}</Badge>
                  <span className="text-ink/60">
                    From {formatDate(s.startDate)} · {formatFcfa(s.feesCommitted)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-base text-navy">Payment records</h2>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-ink/50">No payments recorded for these children.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-ink/70">
              {payments.map((p) => (
                <li key={p.id}>
                  {formatDate(p.paidAt)}: {formatFcfa(p.amount)} for {p.schoolRecord.application.child?.fullName} ({p.schoolRecord.schoolYear})
                  {p.paidBy ? `, paid by ${p.paidBy}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-base text-navy">Reports sent</h2>
          {sponsor.reports.length > 0 && (
            <ul className="mb-4 mt-3 space-y-1 text-sm text-ink/70">
              {sponsor.reports.map((r) => (
                <li key={r.id}>
                  {r.term}
                  {childName(r.childId) ? `, ${childName(r.childId)}` : ''}: {r.sentAt ? `sent ${formatDate(r.sentAt)}` : 'not sent'}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <QuickForm
              submitLabel="Record report"
              fields={[
                { name: 'term', label: 'Term', required: true },
                { name: 'childId', label: 'Child', type: 'select', options: children },
                { name: 'sentAt', label: 'Date sent', type: 'date', wide: true },
              ]}
              action={addSponsorReport.bind(null, id)}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
