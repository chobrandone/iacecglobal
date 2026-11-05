import Link from 'next/link';
import { AlertTriangle, DatabaseBackup } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { ageOf, formatDate, formatDateTime, formatFcfa, statusLabels } from '@/lib/sponsorship/format';
import { schoolYear } from '@/lib/sponsorship/mapping';
import { closedStatuses } from '@/lib/sponsorship/workflow';
import { BackUpNowButton } from '@/components/sponsorship/BackupActions';
import { BarList, ColumnChart, GroupedBars } from '@/components/sponsorship/Charts';
import { Badge, Card, PageTitle } from '@/components/admin/ui';

const DAY = 86_400_000;
const ageGroups = [
  { label: '0–5', min: 0, max: 5 },
  { label: '6–10', min: 6, max: 10 },
  { label: '11–15', min: 11, max: 15 },
  { label: '16+', min: 16, max: 200 },
];

function Alert({ title, items }: { title: string; items: { id: string; label: string }[] }) {
  return (
    <Card>
      <p className="flex items-center gap-2 font-heading text-sm font-semibold text-navy">
        <AlertTriangle className={items.length ? 'h-4 w-4 text-gold-deep' : 'h-4 w-4 text-ink/30'} aria-hidden="true" />
        {title}
        <span className="ml-auto text-ink/60">{items.length}</span>
      </p>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {items.slice(0, 5).map((item, i) => (
            <li key={`${item.id}-${i}`}>
              <Link href={`/admin/sponsorship/applications/${item.id}`} className="text-navy underline decoration-gold underline-offset-2">
                {item.label}
              </Link>
            </li>
          ))}
          {items.length > 5 && <li className="text-xs text-ink/50">and {items.length - 5} more</li>}
        </ul>
      )}
    </Card>
  );
}

export default async function SponsorshipOverview() {
  const user = await requirePage('sponsorship');
  const now = Date.now();
  const year = schoolYear();

  const [settings, applications, recentConcerns, feeRecords, committed, lastBackup] = await Promise.all([
    prisma.sponsorshipSettings.findUnique({ where: { id: 1 } }),
    prisma.childApplication.findMany({
      select: {
        id: true,
        reference: true,
        status: true,
        documentsComplete: true,
        createdAt: true,
        isTest: true,
        child: { select: { fullName: true, gender: true, dateOfBirth: true, visits: { orderBy: { date: 'desc' }, take: 1, select: { date: true } } } },
      },
    }),
    prisma.visitLog.findMany({
      where: { wellbeing: 'CONCERN', date: { gte: new Date(now - 60 * DAY) } },
      orderBy: { date: 'desc' },
      select: { date: true, child: { select: { fullName: true, applicationId: true } } },
    }),
    prisma.schoolRecord.findMany({ include: { payments: true, application: { select: { id: true, child: { select: { fullName: true } } } } } }),
    prisma.sponsorship.aggregate({ where: { status: 'ACTIVE' }, _sum: { feesCommitted: true } }),
    prisma.backupRun.findFirst({ where: { type: { not: 'REALTIME' } }, orderBy: { startedAt: 'desc' } }),
  ]);
  await audit(user, 'view', 'sponsorship-overview');
  const driveConnected = !!settings?.googleRefreshToken || !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  const count = (...statuses: string[]) => applications.filter((a) => statuses.includes(a.status)).length;
  const target = settings?.targetChildren ?? 12;
  const sponsored = count('SPONSORED');
  const cards = [
    { label: 'Total applications', value: applications.length },
    { label: 'New', value: count('NEW') },
    { label: 'Home visit scheduled', value: count('VISIT_SCHEDULED') },
    { label: 'Verified', value: count('VERIFIED') },
    { label: 'Accepted', value: count('ACCEPTED') },
    { label: 'Waiting list', value: count('WAITING_LIST') },
    { label: 'Not accepted', value: count('NOT_ACCEPTED') },
    { label: 'Sponsored children', value: sponsored },
    { label: 'Available places', value: Math.max(0, target - sponsored), note: `Target ${target}` },
  ];

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return { key: d.toISOString().slice(0, 7), label: new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(d) };
  });
  const perMonth = months.map((m) => ({ label: m.label, value: applications.filter((a) => a.createdAt.toISOString().startsWith(m.key)).length }));
  const byStatus = Object.entries(statusLabels).map(([status, label]) => ({ label, value: count(status) }));
  const byAge = ageGroups.map((g) => {
    const inGroup = applications.filter((a) => a.child && ageOf(a.child.dateOfBirth) >= g.min && ageOf(a.child.dateOfBirth) <= g.max);
    return { label: g.label, first: inGroup.filter((a) => a.child?.gender === 'FEMALE').length, second: inGroup.filter((a) => a.child?.gender === 'MALE').length };
  });

  const feesPaid = feeRecords.filter((r) => r.schoolYear === year).flatMap((r) => r.payments).reduce((sum, p) => sum + p.amount, 0);
  const feesCommitted = committed._sum.feesCommitted ?? 0;

  const label = (a: (typeof applications)[number]) => `${a.reference} · ${a.child?.fullName ?? ''}`;
  const open = applications.filter((a) => !closedStatuses.includes(a.status));
  const alerts = {
    stale: open.filter((a) => a.status === 'NEW' && now - a.createdAt.getTime() > 7 * DAY),
    documents: open.filter((a) => !a.documentsComplete),
    visits: applications.filter((a) => (a.status === 'SPONSORED' || a.status === 'ACCEPTED') && !(a.child?.visits[0] && now - a.child.visits[0].date.getTime() <= 60 * DAY)),
  };
  const feesDue = feeRecords.filter((r) => {
    const paid = r.payments.reduce((sum, p) => sum + p.amount, 0);
    return r.feesDueDate && paid < r.feesDue && r.feesDueDate.getTime() - now <= 30 * DAY;
  });

  return (
    <>
      <PageTitle title={settings?.programmeName ?? 'Child Sponsorship Programme'} description="Confidential. Every visit to these pages is recorded." />
      {applications.some((a) => a.isTest) && (
        <p className="mb-4">
          <Badge tone="muted">Includes test records</Badge>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-ink/60">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{c.value}</p>
            {c.note && <p className="text-xs text-ink/45">{c.note}</p>}
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-base text-navy">Needs attention</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Alert title="New for over 7 days with no action" items={alerts.stale.map((a) => ({ id: a.id, label: label(a) }))} />
        <Alert title="Documents incomplete" items={alerts.documents.map((a) => ({ id: a.id, label: label(a) }))} />
        <Alert title="No visit in the last 60 days" items={alerts.visits.map((a) => ({ id: a.id, label: label(a) }))} />
        <Alert title="Fees due within 30 days" items={feesDue.map((r) => ({ id: r.application.id, label: `${r.application.child?.fullName ?? ''} · due ${formatDate(r.feesDueDate)}` }))} />
        <Alert title="Wellbeing concerns in the last 60 days" items={recentConcerns.map((v) => ({ id: v.child.applicationId, label: `${v.child.fullName} · ${formatDate(v.date)}` }))} />
      </div>

      <h2 className="mb-3 mt-8 text-base text-navy">Figures</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <ColumnChart title="Applications per month" data={perMonth} />
        <BarList title="Children by status" data={byStatus} />
        <GroupedBars title="Children by gender and age group" firstLabel="Girls" secondLabel="Boys" data={byAge} />
        <Card>
          <h2 className="text-sm text-navy">Fees this school year ({year})</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-ink/60">Committed by sponsors</dt>
              <dd className="mt-1 text-xl font-semibold text-navy">{formatFcfa(feesCommitted)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/60">Paid</dt>
              <dd className="mt-1 text-xl font-semibold text-navy">{formatFcfa(feesPaid)}</dd>
            </div>
          </dl>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-navy/10" role="img" aria-label={`${formatFcfa(feesPaid)} paid of ${formatFcfa(feesCommitted)} committed`}>
            <div className="h-full rounded-full bg-[#1F5FAE]" style={{ width: feesCommitted ? `${Math.min(100, (feesPaid / feesCommitted) * 100)}%` : 0 }} />
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-base text-navy">Backups</h2>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-ink/70">
          <DatabaseBackup className="h-4 w-4 text-gold-deep" aria-hidden="true" />
          {lastBackup ? `Last backup: ${formatDateTime(lastBackup.startedAt)} (${lastBackup.status.toLowerCase()})` : 'No backup has run yet.'}
          {!driveConnected && ' Google Drive is not connected.'}
        </p>
        {driveConnected && <BackUpNowButton />}
      </Card>
    </>
  );
}
