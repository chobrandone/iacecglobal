import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ApplicationStatus } from '@prisma/client';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { can, requirePage } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { documentFields, type FieldOverrides } from '@/lib/sponsorship/fields';
import { ageOf, formatDate, formatDateTime, formatFcfa, statusLabels, statusOptions, statusTone, visitTypeLabels, wellbeingLabels } from '@/lib/sponsorship/format';
import { allStepIds, applicationInclude, schoolYear, toValues } from '@/lib/sponsorship/mapping';
import { canMove, exitReasons } from '@/lib/sponsorship/workflow';
import { ApplicationForm } from '@/components/sponsorship/ApplicationForm';
import { DeleteChild } from '@/components/sponsorship/DeleteChild';
import { DocumentsPanel } from '@/components/sponsorship/DocumentsPanel';
import { QuickForm, type QuickField } from '@/components/sponsorship/QuickForm';
import { StatusControl } from '@/components/sponsorship/StatusControl';
import { Badge, Button, Card, PageTitle } from '@/components/admin/ui';
import { cn } from '@/lib/utils';
import { addFeePayment, addMaterialSupport, addNote, addSchoolRecord, addSponsorship, addVisit, saveApplication, saveVerification, setSponsorshipStatus } from '../../_actions';

const tabs = [
  { id: 'application', label: 'Application' },
  { id: 'documents', label: 'Documents' },
  { id: 'verification', label: 'Verification' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'care-team', label: 'Care team' },
  { id: 'visits', label: 'Visits and follow-up' },
  { id: 'school', label: 'School and fees' },
  { id: 'material', label: 'Material support' },
  { id: 'notes', label: 'Notes' },
  { id: 'print', label: 'Print / PDF' },
];

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

const verificationFields: QuickField[] = [
  { name: 'visitDate', label: 'Home visit date', type: 'date' },
  { name: 'visitedBy', label: 'Visited by' },
  { name: 'findings', label: 'Findings', type: 'textarea' },
  { name: 'documentsVerified', label: 'Documents verified', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { name: 'recommendation', label: 'Recommendation', type: 'textarea' },
  { name: 'decision', label: 'Decision', type: 'select', options: [{ value: 'ACCEPTED', label: 'Accepted' }, { value: 'WAITING_LIST', label: 'Waiting list' }, { value: 'NOT_ACCEPTED', label: 'Not accepted' }] },
  { name: 'decisionReason', label: 'Reason for the decision', type: 'textarea' },
];

const visitFields: QuickField[] = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'byName', label: 'By whom', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: options(visitTypeLabels) },
  { name: 'wellbeing', label: 'Child’s wellbeing', type: 'select', required: true, options: options(wellbeingLabels) },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'photos', label: 'Photos', type: 'files' },
];

const paymentFields: QuickField[] = [
  { name: 'amount', label: 'Amount paid (FCFA)', type: 'number', required: true },
  { name: 'paidAt', label: 'Date paid', type: 'date', required: true },
  { name: 'paidBy', label: 'Paid by' },
  { name: 'receipt', label: 'Receipt', type: 'files' },
];

const materialFields: QuickField[] = [
  { name: 'item', label: 'Item', required: true },
  { name: 'givenAt', label: 'Date', type: 'date', required: true },
  { name: 'value', label: 'Value (FCFA)', type: 'number' },
  { name: 'givenBy', label: 'Given by' },
];

const day = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePage('sponsorship');
  const { id } = await params;
  const requested = (await searchParams).tab;
  const tab = tabs.some((t) => t.id === requested) ? requested! : 'application';

  const application = await prisma.childApplication.findUnique({
    where: { id },
    include: {
      ...applicationInclude,
      assignedTo: { select: { name: true } },
      verification: true,
      documents: { orderBy: { createdAt: 'asc' } },
      statusChanges: { orderBy: { createdAt: 'desc' } },
      fieldChanges: { orderBy: { createdAt: 'desc' }, take: 50 },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!application || !application.child) notFound();
  const child = application.child;
  const [settings, visits, material, schoolRecords, sponsorships, sponsors] = await Promise.all([
    prisma.sponsorshipSettings.findUnique({ where: { id: 1 } }),
    prisma.visitLog.findMany({ where: { childId: child.id }, orderBy: { date: 'desc' }, include: { photos: true } }),
    prisma.materialSupport.findMany({ where: { childId: child.id }, orderBy: { givenAt: 'desc' } }),
    prisma.schoolRecord.findMany({ where: { applicationId: id }, orderBy: { createdAt: 'desc' }, include: { payments: { orderBy: { paidAt: 'desc' }, include: { receiptDocument: true } } } }),
    prisma.sponsorship.findMany({ where: { childId: child.id }, orderBy: { startDate: 'desc' }, include: { sponsor: { select: { id: true, fullName: true } } } }),
    prisma.sponsor.findMany({ where: { status: { not: 'INACTIVE' } }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, organisation: true } }),
  ]);
  await audit(user, 'view', 'application', id, { tab });

  const overrides = (settings?.fieldOverrides ?? {}) as FieldOverrides;
  const slots = documentFields().map((f) => ({ type: f.docType!, label: f.label, required: !!f.required }));
  const v = application.verification;
  const careTeamWarning = application.references.length < 2 || application.careTeam.length < 2;

  return (
    <>
      <Link href="/admin/sponsorship/applications" className="mb-3 inline-flex items-center gap-1 text-sm text-ink/60 hover:text-navy">
        <ChevronLeft className="h-4 w-4" /> Applications
      </Link>
      <PageTitle
        title={child.fullName}
        description={`${application.reference} · ${ageOf(child.dateOfBirth)} years · ${application.source === 'PAPER' ? 'Paper form' : 'Online form'} · Received ${formatDate(application.createdAt)}`}
        actions={
          <StatusControl
            id={id}
            status={application.status}
            options={statusOptions.filter((o) => o.value === application.status || canMove(application.status, o.value as ApplicationStatus, can(user.role, 'sponsorship-admin')))}
            exitReasons={exitReasons}
            canEmail={!!application.caretaker?.email}
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={statusTone[application.status]}>{statusLabels[application.status]}</Badge>
        {!application.documentsComplete && <Badge tone="red">Documents incomplete</Badge>}
        {application.isTest && <Badge tone="muted">Test record</Badge>}
        <span className="text-xs text-ink/55">Coordinator: {application.assignedTo?.name ?? 'Not assigned'}</span>
      </div>
      <nav aria-label="Child profile" className="mb-5 flex gap-1 overflow-x-auto border-b border-navy/10">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/sponsorship/applications/${id}?tab=${t.id}`}
            aria-current={t.id === tab ? 'page' : undefined}
            className={cn('whitespace-nowrap border-b-2 px-3 py-2 font-heading text-[0.8rem] font-semibold', t.id === tab ? 'border-gold text-navy' : 'border-transparent text-ink/55 hover:text-navy')}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'application' && (
        <div className="space-y-4">
          <ApplicationForm key={application.updatedAt.toISOString()} stepIds={allStepIds} initial={toValues(application)} overrides={overrides} save={saveApplication.bind(null, id, allStepIds)} />
          <Card>
            <h2 className="text-base text-navy">Change history</h2>
            {application.statusChanges.length + application.fieldChanges.length === 0 ? (
              <p className="mt-2 text-sm text-ink/50">No changes yet.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                {application.statusChanges.map((c) => (
                  <li key={c.id}>
                    <span className="text-ink/45">{formatDateTime(c.createdAt)}</span> {c.userName}: status {c.from ? `${statusLabels[c.from]} → ` : ''}
                    {statusLabels[c.to]}
                    {c.reason ? ` (${c.reason})` : ''}
                  </li>
                ))}
                {application.fieldChanges.map((c) => (
                  <li key={c.id}>
                    <span className="text-ink/45">{formatDateTime(c.createdAt)}</span> {c.userName}: {c.field}
                    {c.oldValue || c.newValue ? `: ${c.oldValue ?? '—'} → ${c.newValue ?? '—'}` : ' changed'}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'documents' && (
        <>
          <p className="mb-3 text-sm text-ink/60">
            {application.documents.length} {application.documents.length === 1 ? 'file' : 'files'}. Each opening is recorded in the audit log.
          </p>
          <DocumentsPanel applicationId={id} slots={slots} documents={application.documents.map((d) => ({ id: d.id, type: d.type, filename: d.filename, verified: d.verified }))} />
        </>
      )}

      {tab === 'verification' && (
        <Card>
          <QuickForm
            keep
            fields={verificationFields}
            submitLabel="Save verification"
            initial={{
              visitDate: day(v?.visitDate),
              visitedBy: v?.visitedBy ?? undefined,
              findings: v?.findings ?? undefined,
              documentsVerified: v ? (v.documentsVerified ? 'yes' : 'no') : undefined,
              recommendation: v?.recommendation ?? undefined,
              decision: v?.decision ?? undefined,
              decisionReason: v?.decisionReason ?? undefined,
            }}
            action={saveVerification.bind(null, id)}
          />
        </Card>
      )}

      {tab === 'sponsor' && (
        <div className="space-y-4">
          {sponsorships.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/sponsorship/sponsors/${s.sponsor.id}`} className="font-semibold text-navy underline decoration-gold underline-offset-2">
                  {s.sponsor.fullName}
                </Link>
                <Badge tone={s.status === 'ACTIVE' ? 'green' : 'muted'}>{s.status.toLowerCase()}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                From {formatDate(s.startDate)} · Fees {formatFcfa(s.feesCommitted)}
                {s.materialCommitment ? ` · ${s.materialCommitment}` : ''}
                {s.frequency ? ` · ${s.frequency}` : ''}
              </p>
              <div className="mt-3 max-w-md">
                <QuickForm
                  keep
                  submitLabel={`Update ${s.sponsor.fullName}`}
                  initial={{ status: s.status }}
                  fields={[{ name: 'status', label: 'Status', type: 'select', required: true, wide: true, options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'PAUSED', label: 'Paused' }, { value: 'ENDED', label: 'Ended' }] }]}
                  action={setSponsorshipStatus.bind(null, id, s.id)}
                />
              </div>
            </Card>
          ))}
          <Card>
            <h2 className="mb-4 text-base text-navy">Assign a sponsor</h2>
            {sponsors.length === 0 ? (
              <p className="text-sm text-ink/55">
                Add a sponsor on the{' '}
                <Link href="/admin/sponsorship/sponsors" className="text-navy underline">
                  Sponsors page
                </Link>{' '}
                first.
              </p>
            ) : (
              <QuickForm
                submitLabel="Assign sponsor"
                fields={[
                  { name: 'sponsorId', label: 'Sponsor', type: 'select', required: true, wide: true, options: sponsors.map((s) => ({ value: s.id, label: s.organisation ? `${s.fullName} (${s.organisation})` : s.fullName })) },
                  { name: 'startDate', label: 'Start date', type: 'date', required: true },
                  { name: 'feesCommitted', label: 'Fees committed per year (FCFA)', type: 'number' },
                  { name: 'materialCommitment', label: 'Material support' },
                  { name: 'frequency', label: 'Frequency' },
                ]}
                action={addSponsorship.bind(null, id, child.id)}
              />
            )}
          </Card>
        </div>
      )}

      {tab === 'care-team' && (
        <div className="space-y-4">
          {careTeamWarning && (
            <p className="flex gap-2 rounded-xl border border-gold/40 bg-gold-tint/60 px-4 py-3 text-sm text-navy" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-gold-deep" aria-hidden="true" />
              Every child needs two family members and two IACEC members. This child has {application.references.length} and {application.careTeam.length}.
            </p>
          )}
          <ApplicationForm key={application.updatedAt.toISOString()} stepIds={['references', 'followup']} initial={toValues(application)} overrides={overrides} save={saveApplication.bind(null, id, ['references', 'followup'])} />
        </div>
      )}

      {tab === 'visits' && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-base text-navy">Log a visit or call</h2>
            <QuickForm fields={visitFields} submitLabel="Save visit" action={addVisit.bind(null, id, child.id)} />
          </Card>
          {visits.map((visit) => (
            <Card key={visit.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-navy">{formatDate(visit.date)}</span>
                <span className="text-ink/60">
                  {visitTypeLabels[visit.type]} · {visit.byName}
                </span>
                <Badge tone={visit.wellbeing === 'CONCERN' ? 'red' : visit.wellbeing === 'FAIR' ? 'gold' : 'green'}>{wellbeingLabels[visit.wellbeing]}</Badge>
              </div>
              {visit.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{visit.notes}</p>}
              {visit.photos.map((p) => (
                <a key={p.id} href={`/api/sponsorship/files/${p.id}`} target="_blank" rel="noreferrer" className="mr-3 mt-2 inline-block text-xs text-navy underline">
                  {p.filename}
                </a>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab === 'school' && (
        <div className="space-y-4">
          {schoolRecords.map((record) => {
            const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <Card key={record.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base text-navy">
                    {record.schoolYear}
                    {record.term ? ` · ${record.term}` : ''}: {record.school}, {record.level}
                  </h2>
                  <p className="text-sm font-semibold text-navy" data-balance>
                    Balance owed: {formatFcfa(Math.max(0, record.feesDue - paid))}
                  </p>
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  Fees due {formatFcfa(record.feesDue)} · Paid {formatFcfa(paid)}
                  {record.feesDueDate ? ` · Due by ${formatDate(record.feesDueDate)}` : ''}
                  {record.results ? ` · Results: ${record.results}` : ''}
                </p>
                {record.payments.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-ink/70">
                    {record.payments.map((p) => (
                      <li key={p.id}>
                        {formatDate(p.paidAt)}: {formatFcfa(p.amount)}
                        {p.paidBy ? ` by ${p.paidBy}` : ''}
                        {p.receiptDocument && (
                          <a href={`/api/sponsorship/files/${p.receiptDocument.id}`} target="_blank" rel="noreferrer" className="ml-2 text-xs text-navy underline">
                            Receipt
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer font-heading text-[0.8rem] font-semibold text-navy">Record a payment</summary>
                  <div className="mt-3">
                    <QuickForm fields={paymentFields} submitLabel="Save payment" action={addFeePayment.bind(null, id, record.id)} />
                  </div>
                </details>
              </Card>
            );
          })}
          <Card>
            <h2 className="mb-4 text-base text-navy">Add a school year or term</h2>
            <QuickForm
              submitLabel="Save school record"
              initial={{ schoolYear: schoolYear() }}
              fields={[
                { name: 'schoolYear', label: 'School year', required: true },
                { name: 'term', label: 'Term' },
                { name: 'school', label: 'School', required: true },
                { name: 'level', label: 'Class or level', required: true },
                { name: 'feesDue', label: 'Fees due (FCFA)', type: 'number', required: true },
                { name: 'feesDueDate', label: 'Fees due by', type: 'date' },
                { name: 'results', label: 'Term results', wide: true },
              ]}
              action={addSchoolRecord.bind(null, id)}
            />
          </Card>
        </div>
      )}

      {tab === 'material' && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-base text-navy">Record material support</h2>
            <QuickForm fields={materialFields} submitLabel="Save support" action={addMaterialSupport.bind(null, id, child.id)} />
          </Card>
          {material.length > 0 && (
            <Card>
              <ul className="space-y-1.5 text-sm text-ink/70">
                {material.map((m) => (
                  <li key={m.id}>
                    {formatDate(m.givenAt)}: {m.item}
                    {m.value !== null ? `, ${formatFcfa(m.value)}` : ''}
                    {m.givenBy ? `, given by ${m.givenBy}` : ''}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'print' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-base text-navy">Complete profile</h2>
            <p className="mt-1 text-sm text-ink/60">Everything on file, including ID numbers and health details. For staff only. The download is recorded.</p>
            <a href={`/api/sponsorship/pdf/${id}`} className="mt-4 inline-block">
              <Button>Download profile PDF</Button>
            </a>
          </Card>
          <Card>
            <h2 className="text-base text-navy">Sponsor report</h2>
            <p className="mt-1 text-sm text-ink/60">First name, age, class and progress only. Safe to send to the sponsor each term.</p>
            <a href={`/api/sponsorship/pdf/${id}?type=report`} className="mt-4 inline-block">
              <Button variant="outline">Download sponsor report</Button>
            </a>
          </Card>
          {can(user.role, 'sponsorship-admin') && (
            <Card className="md:col-span-2">
              <h2 className="text-base text-navy">Delete this record permanently</h2>
              <p className="mb-4 mt-1 text-sm text-ink/60">Removes the record, all uploaded files and the child’s Google Drive folder. Older database backups keep a copy until they expire, but a restore will not bring this child back. This cannot be undone.</p>
              <DeleteChild id={id} reference={application.reference} />
            </Card>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <Card>
            <QuickForm fields={[{ name: 'body', label: 'New note', type: 'textarea', required: true }]} submitLabel="Save note" action={addNote.bind(null, id)} />
          </Card>
          {application.notes.map((n) => (
            <Card key={n.id}>
              <p className="text-xs text-ink/50">
                {n.authorName} · {formatDateTime(n.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/75">{n.body}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
