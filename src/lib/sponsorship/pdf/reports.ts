import { prisma } from '@/lib/db';
import { displayValue } from '../display';
import { isVisible, withOverrides, type FieldOverrides } from '../fields';
import { ageOf, formatDate, formatDateTime, formatFcfa, statusLabels, visitTypeLabels, wellbeingLabels } from '../format';
import { applicationInclude, toValues } from '../mapping';
import { Sheet } from './sheet';

const fullInclude = {
  ...applicationInclude,
  assignedTo: { select: { name: true } },
  verification: true,
  documents: { orderBy: { createdAt: 'asc' } },
  statusChanges: { orderBy: { createdAt: 'asc' } },
  notes: { orderBy: { createdAt: 'asc' } },
} as const;

/** The complete record, for authorised staff. Contains sensitive data. */
export async function profilePdf(id: string) {
  const application = await prisma.childApplication.findUnique({ where: { id }, include: fullInclude });
  if (!application?.child) return null;
  const child = application.child;
  const [settings, visits, material, schoolRecords, sponsorships] = await Promise.all([
    prisma.sponsorshipSettings.findUnique({ where: { id: 1 } }),
    prisma.visitLog.findMany({ where: { childId: child.id }, orderBy: { date: 'asc' } }),
    prisma.materialSupport.findMany({ where: { childId: child.id }, orderBy: { givenAt: 'asc' } }),
    prisma.schoolRecord.findMany({ where: { applicationId: id }, orderBy: { createdAt: 'asc' }, include: { payments: { orderBy: { paidAt: 'asc' } } } }),
    prisma.sponsorship.findMany({ where: { childId: child.id }, include: { sponsor: { select: { fullName: true } } } }),
  ]);

  const sheet = await Sheet.create(`Child profile ${application.reference}`, 'Strictly confidential. Do not copy or forward.');
  sheet.text(child.fullName, { size: 16, bold: true });
  sheet.text(`${application.reference} · ${statusLabels[application.status]} · Coordinator: ${application.assignedTo?.name ?? 'Not assigned'}`, { size: 9.5, muted: true });
  sheet.text(`Received ${formatDate(application.createdAt)} · ${application.source === 'PAPER' ? 'Paper form' : 'Online form'} · Printed ${formatDateTime(new Date())}`, { size: 9.5, muted: true });

  const values = toValues(application);
  for (const step of withOverrides((settings?.fieldOverrides ?? {}) as FieldOverrides).filter((s) => s.id !== 'documents')) {
    sheet.heading(step.title);
    for (const group of step.groups) {
      const rows = group.fields.filter((f) => f.type !== 'file' && f.type !== 'signature' && isVisible(f, values)).map((f) => [f.label, displayValue(f, values[f.name])] as const).filter(([, v]) => v);
      if (!rows.length) continue;
      if (group.title) sheet.subheading(group.title);
      rows.forEach(([label, value]) => sheet.row(label, value));
    }
  }

  sheet.heading('Documents');
  if (!application.documents.length) sheet.text('No documents on file.', { size: 9.5, muted: true });
  application.documents.forEach((d) => sheet.row(d.type.replace(/_/g, ' ').toLowerCase(), `${d.filename}${d.verified ? ' (verified)' : ''}`));

  const v = application.verification;
  if (v) {
    sheet.heading('Verification');
    sheet.row('Home visit', `${formatDate(v.visitDate)}${v.visitedBy ? ` by ${v.visitedBy}` : ''}`);
    if (v.findings) sheet.row('Findings', v.findings);
    sheet.row('Documents verified', v.documentsVerified ? 'Yes' : 'No');
    if (v.recommendation) sheet.row('Recommendation', v.recommendation);
    if (v.decision) sheet.row('Decision', `${statusLabels[v.decision]}${v.decisionReason ? `: ${v.decisionReason}` : ''}`);
  }

  if (sponsorships.length) {
    sheet.heading('Sponsors');
    sponsorships.forEach((s) => sheet.row(s.sponsor.fullName, `From ${formatDate(s.startDate)} · ${formatFcfa(s.feesCommitted)} · ${s.status.toLowerCase()}`));
  }

  if (visits.length) {
    sheet.heading('Visits and follow-up');
    visits.forEach((x) => sheet.row(`${formatDate(x.date)} · ${visitTypeLabels[x.type]}`, `${x.byName} · ${wellbeingLabels[x.wellbeing]}${x.notes ? `\n${x.notes}` : ''}`));
  }

  sheet.heading('School and fees');
  schoolRecords.forEach((r) => {
    const paid = r.payments.reduce((sum, p) => sum + p.amount, 0);
    sheet.row(`${r.schoolYear}${r.term ? ` · ${r.term}` : ''}`, `${r.school}, ${r.level}\nDue ${formatFcfa(r.feesDue)} · Paid ${formatFcfa(paid)} · Balance ${formatFcfa(Math.max(0, r.feesDue - paid))}${r.results ? `\nResults: ${r.results}` : ''}`);
  });

  if (material.length) {
    sheet.heading('Material support');
    material.forEach((m) => sheet.row(formatDate(m.givenAt), `${m.item}${m.value !== null ? ` · ${formatFcfa(m.value)}` : ''}${m.givenBy ? ` · ${m.givenBy}` : ''}`));
  }

  if (application.notes.length) {
    sheet.heading('Internal notes');
    application.notes.forEach((n) => sheet.row(`${n.authorName} · ${formatDate(n.createdAt)}`, n.body));
  }

  sheet.heading('Status history');
  application.statusChanges.forEach((c) => sheet.row(formatDateTime(c.createdAt), `${c.from ? `${statusLabels[c.from]} -> ` : ''}${statusLabels[c.to]} (${c.userName})${c.reason ? `: ${c.reason}` : ''}`));

  return { bytes: await sheet.finish(), filename: `${application.reference}-profile.pdf` };
}

/** The visits alone, for the child's Visits folder in Drive. */
export async function visitLogPdf(id: string) {
  const application = await prisma.childApplication.findUnique({ where: { id }, include: { child: { include: { visits: { orderBy: { date: 'asc' } } } } } });
  if (!application?.child?.visits.length) return null;
  const sheet = await Sheet.create(`Visit log ${application.reference}`, 'Strictly confidential. Do not copy or forward.');
  sheet.text(application.child.fullName, { size: 14, bold: true });
  sheet.heading('Visits and follow-up');
  application.child.visits.forEach((x) => sheet.row(`${formatDate(x.date)} · ${visitTypeLabels[x.type]}`, `${x.byName} · ${wellbeingLabels[x.wellbeing]}${x.notes ? `\n${x.notes}` : ''}`));
  return sheet.finish();
}

export type SponsorReportData = {
  fullName: string;
  dateOfBirth: Date;
  level: string | null;
  results: string | null;
  feesDue: number;
  feesPaid: number;
  visitCount: number;
  lastVisit: Date | null;
  materialItems: string[];
};

/**
 * What a sponsor may read: first name, age, class and progress only. Surnames, addresses, schools,
 * caretakers, ID numbers, health and family details, and visit notes are deliberately left out.
 */
export function sponsorReportRows(d: SponsorReportData) {
  return [
    ['Child', d.fullName.split(/\s+/)[0]],
    ['Age', `${ageOf(d.dateOfBirth)} years`],
    ['Class', d.level ?? '—'],
    ['Latest results', d.results ?? 'Not yet recorded'],
    ['Fees this year', `${formatFcfa(d.feesPaid)} paid of ${formatFcfa(d.feesDue)}`],
    ['Follow-up', d.visitCount ? `${d.visitCount} ${d.visitCount === 1 ? 'visit or call' : 'visits or calls'}, most recently ${formatDate(d.lastVisit)}` : 'No visits recorded yet'],
    ['Material support', d.materialItems.length ? d.materialItems.join(', ') : 'None recorded'],
  ] as const;
}

export async function sponsorReportPdf(id: string) {
  const application = await prisma.childApplication.findUnique({ where: { id }, include: { child: true } });
  if (!application?.child) return null;
  const childId = application.child.id;
  const [settings, record, visits, material] = await Promise.all([
    prisma.sponsorshipSettings.findUnique({ where: { id: 1 } }),
    prisma.schoolRecord.findFirst({ where: { applicationId: id }, orderBy: { createdAt: 'desc' }, include: { payments: true } }),
    prisma.visitLog.findMany({ where: { childId }, orderBy: { date: 'desc' }, select: { date: true } }),
    prisma.materialSupport.findMany({ where: { childId }, orderBy: { givenAt: 'desc' }, select: { item: true } }),
  ]);
  const programme = settings?.programmeName ?? 'Child Sponsorship Programme';
  const sheet = await Sheet.create('Sponsor report', `${programme} · Please keep this report private.`);
  sheet.text('Sponsor report', { size: 16, bold: true });
  sheet.text(`${programme} · ${formatDate(new Date())}`, { size: 9.5, muted: true });
  sheet.y -= 12;
  for (const [label, value] of sponsorReportRows({
    fullName: application.child.fullName,
    dateOfBirth: application.child.dateOfBirth,
    level: record?.level ?? null,
    results: record?.results ?? null,
    feesDue: record?.feesDue ?? 0,
    feesPaid: record?.payments.reduce((sum, p) => sum + p.amount, 0) ?? 0,
    visitCount: visits.length,
    lastVisit: visits[0]?.date ?? null,
    materialItems: material.map((m) => m.item),
  })) {
    sheet.row(label, value);
  }
  sheet.y -= 14;
  sheet.text('Thank you for walking with this child. Please do not share this report or publish it online.', { size: 9.5 });
  return { bytes: await sheet.finish(), filename: `${application.reference}-sponsor-report.pdf` };
}
