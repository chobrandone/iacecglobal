'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import type { ApplicationStatus, DocumentType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { runBackup, testConnection } from '@/lib/drive/backup';
import { connectDrive } from '@/lib/drive/client';
import { processJobs, queueSync } from '@/lib/drive/jobs';
import { deleteApplicationFolder } from '@/lib/drive/sync';
import { can, requireCapability } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { allFields, documentFields, isVisible, steps as defaultSteps, type FieldOverrides, type FileRef, type Values } from '@/lib/sponsorship/fields';
import { allStepIds, applicationInclude, createData, editableSteps, toRecords, toValues, type Records } from '@/lib/sponsorship/mapping';
import { notifyStatusChange } from '@/lib/sponsorship/notify';
import { nextReference } from '@/lib/sponsorship/reference';
import { statusLabels } from '@/lib/sponsorship/format';
import { isEmptyPhone, validateAll, type Errors } from '@/lib/sponsorship/schema';
import { removePrivate, verifyUpload } from '@/lib/sponsorship/storage';
import { canMove } from '@/lib/sponsorship/workflow';

export type ActionResult = { ok: true; id?: string; skipped?: number } | { ok: false; error?: string; errors?: Errors };

const staff = () => requireCapability('sponsorship');
const refresh = (id: string) => {
  revalidatePath(`/admin/sponsorship/applications/${id}`);
  // After the response, so a Drive outage never slows or blocks the screen.
  after(async () => {
    await queueSync(id);
    await processJobs();
  });
};
const failed = (e: unknown): ActionResult => ({ ok: false, error: e instanceof z.ZodError ? e.issues.map((i) => i.message).join(' · ') : e instanceof Error ? e.message : 'Something went wrong.' });

async function overrides() {
  const row = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  return (row?.fieldOverrides ?? {}) as FieldOverrides;
}

const comparable = (type: string, value: unknown) => {
  if (type === 'tel' && typeof value === 'string' && isEmptyPhone(value)) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value ?? '').trim();
};

async function writeRecords(tx: Prisma.TransactionClient, id: string, r: Records) {
  await tx.childApplication.update({ where: { id }, data: r.application });
  const child = await tx.child.update({ where: { applicationId: id }, data: r.child });
  await tx.sibling.deleteMany({ where: { childId: child.id } });
  await tx.sibling.createMany({ data: r.siblings.map((s) => ({ ...s, childId: child.id })) });
  for (const parent of r.parents) {
    await tx.parent.upsert({ where: { applicationId_role: { applicationId: id, role: parent.role } }, create: { ...parent, applicationId: id }, update: parent });
  }
  await tx.caretaker.upsert({ where: { applicationId: id }, create: { ...r.caretaker, applicationId: id }, update: r.caretaker });
  for (const ref of r.references) {
    await tx.familyReference.upsert({ where: { applicationId_position: { applicationId: id, position: ref.position } }, create: { ...ref, applicationId: id }, update: ref });
  }
  await tx.careTeamMember.deleteMany({ where: { applicationId: id } });
  await tx.careTeamMember.createMany({ data: r.careTeam.map((m) => ({ ...m, applicationId: id })) });
  await tx.referral.upsert({ where: { applicationId: id }, create: { ...r.referral, applicationId: id }, update: r.referral });
  const first = await tx.schoolRecord.findFirst({ where: { applicationId: id }, orderBy: { createdAt: 'asc' } });
  if (first) await tx.schoolRecord.update({ where: { id: first.id }, data: r.school });
}

/** Saves edits from the Application or Care team tab, with a history of what changed. */
export async function saveApplication(id: string, stepIds: string[], input: Values): Promise<ActionResult> {
  try {
    const user = await staff();
    const application = await prisma.childApplication.findUniqueOrThrow({ where: { id }, include: applicationInclude });
    const before = toValues(application);
    const merged = { ...before, ...input };
    const steps = editableSteps(await overrides(), stepIds);
    const { errors } = validateAll(steps, merged);
    if (Object.keys(errors).length) return { ok: false, errors, error: 'Please check the highlighted fields.' };

    // Sensitive answers record that they changed, never what they were.
    const changes = allFields(steps)
      .filter((f) => isVisible(f, merged) && comparable(f.type, before[f.name]) !== comparable(f.type, merged[f.name]))
      .map((f) => ({
        applicationId: id,
        field: f.label,
        oldValue: f.sensitive ? null : comparable(f.type, before[f.name]) || null,
        newValue: f.sensitive ? null : comparable(f.type, merged[f.name]) || null,
        userId: user.id,
        userName: user.name,
      }));
    if (!changes.length) return { ok: true };

    await prisma.$transaction(async (tx) => {
      await writeRecords(tx, id, toRecords(merged));
      await tx.fieldChange.createMany({ data: changes });
    });
    await audit(user, 'edit', 'application', id, { fields: changes.map((c) => c.field) });
    refresh(id);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

/** Enters a paper form. Documents are added afterwards on the Documents tab. */
export async function createPaperApplication(input: Values): Promise<ActionResult> {
  try {
    const user = await staff();
    const { errors } = validateAll(editableSteps(await overrides(), allStepIds), input);
    if (Object.keys(errors).length) return { ok: false, errors, error: 'Please check the highlighted fields.' };
    const application = await prisma.$transaction(async (tx) => {
      const reference = await nextReference(tx);
      return tx.childApplication.create({
        data: { ...createData(toRecords(input)), reference, source: 'PAPER', assignedToId: user.id, statusChanges: { create: { to: 'NEW', userId: user.id, userName: user.name } } },
      });
    });
    await audit(user, 'create', 'application', application.id, { source: 'PAPER' });
    refresh(application.id);
    revalidatePath('/admin/sponsorship/applications');
    return { ok: true, id: application.id };
  } catch (e) {
    return failed(e);
  }
}

const statusSchema = z.enum(['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VERIFIED', 'ACCEPTED', 'WAITING_LIST', 'NOT_ACCEPTED', 'SPONSORED', 'EXITED']);

type Staff = Awaited<ReturnType<typeof staff>>;

/** Throws if this person may not make this move. */
async function checkMove(id: string, to: ApplicationStatus, user: Staff) {
  const application = await prisma.childApplication.findUniqueOrThrow({ where: { id }, include: { child: { include: { sponsorships: { where: { status: 'ACTIVE' } } } }, caretaker: true } });
  if (application.status === to) return application;
  if (!canMove(application.status, to, can(user.role, 'sponsorship-admin'))) throw new Error(`An application cannot move from ${statusLabels[application.status]} to ${statusLabels[to]}.`);
  if (to === 'SPONSORED' && !application.child?.sponsorships.length) throw new Error('Assign a sponsor on the Sponsor tab first.');
  return application;
}

async function applyStatus(id: string, to: ApplicationStatus, reason: string | null, user: Staff, email = false) {
  const application = await checkMove(id, to, user);
  if (application.status === to) return;
  const sendEmail = email && !!application.caretaker?.email;
  await prisma.$transaction([
    prisma.childApplication.update({ where: { id }, data: { status: to, exitReason: to === 'EXITED' ? reason : application.exitReason } }),
    prisma.statusChange.create({ data: { applicationId: id, from: application.status, to, reason, userId: user.id, userName: user.name, emailed: sendEmail } }),
    ...(to === 'EXITED' && application.child ? [prisma.sponsorship.updateMany({ where: { childId: application.child.id, status: 'ACTIVE' }, data: { status: 'ENDED', endDate: new Date() } })] : []),
  ]);
  await audit(user, 'status', 'application', id, { from: application.status, to, emailed: sendEmail });
  if (sendEmail) await notifyStatusChange(application.caretaker!.email!, application.reference, to);
}

export async function setStatus(id: string, to: string, reason: string, email = false): Promise<ActionResult> {
  try {
    const user = await staff();
    const status = statusSchema.parse(to);
    if (status === 'EXITED' && !reason.trim()) return { ok: false, error: 'Please give the exit reason.' };
    await applyStatus(id, status, reason.trim() || null, user, email);
    refresh(id);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function bulkUpdate(ids: string[], input: { status?: string; assignedToId?: string }): Promise<ActionResult> {
  try {
    const user = await staff();
    if (input.status === 'EXITED') return { ok: false, error: 'Please exit children one at a time, so each has a reason.' };
    const status = input.status ? statusSchema.parse(input.status) : null;
    if (input.assignedToId) {
      const coordinator = await prisma.user.findFirst({ where: { id: input.assignedToId, active: true, role: { in: ['ADMIN', 'SPONSORSHIP_COORDINATOR'] } } });
      if (!coordinator) return { ok: false, error: 'That coordinator was not found.' };
      await prisma.childApplication.updateMany({ where: { id: { in: ids } }, data: { assignedToId: coordinator.id } });
      await audit(user, 'edit', 'application', undefined, { bulk: ids, assignedTo: coordinator.id });
    }
    let skipped = 0;
    if (status) {
      for (const id of ids) await applyStatus(id, status, null, user).catch(() => (skipped += 1));
    }
    revalidatePath('/admin/sponsorship/applications');
    return { ok: true, skipped };
  } catch (e) {
    return failed(e);
  }
}

async function checkedFile(ref: FileRef, token: string | null) {
  const session = token ? await prisma.uploadSession.findUnique({ where: { token } }) : null;
  const checked = session?.keys.includes(ref.key) ? await verifyUpload(ref.key) : null;
  if (!checked) throw new Error('This file could not be read. Please try another file.');
  return { storageKey: ref.key, filename: ref.filename, mimeType: checked.mimeType, size: checked.size };
}

async function refreshDocumentsComplete(applicationId: string) {
  const present = await prisma.applicationDocument.findMany({ where: { applicationId }, select: { type: true }, distinct: ['type'] });
  const documentsComplete = documentFields().every((f) => present.some((d) => d.type === f.docType));
  await prisma.childApplication.update({ where: { id: applicationId }, data: { documentsComplete } });
}

const documentType = z.enum(['BIRTH_CERTIFICATE', 'DEATH_PROOF', 'CARETAKER_ID', 'REPORT_CARD', 'FEES_RECEIPT', 'PASSPORT_PHOTO', 'RECOMMENDATION', 'REFERENCE_ID', 'CHILD_PHOTO', 'VISIT_PHOTO', 'OTHER']);

export async function addDocument(applicationId: string, type: string, ref: FileRef, token: string | null): Promise<ActionResult> {
  try {
    const user = await staff();
    const doc = await prisma.applicationDocument.create({
      data: { ...(await checkedFile(ref, token)), applicationId, type: documentType.parse(type) as DocumentType, uploadedById: user.id },
    });
    await refreshDocumentsComplete(applicationId);
    await audit(user, 'create', 'document', doc.id, { applicationId, type });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function replaceDocument(id: string, ref: FileRef, token: string | null): Promise<ActionResult> {
  try {
    const user = await staff();
    const old = await prisma.applicationDocument.findUniqueOrThrow({ where: { id } });
    await prisma.applicationDocument.update({ where: { id }, data: { ...(await checkedFile(ref, token)), verified: false, verifiedById: null, verifiedAt: null, uploadedById: user.id } });
    await removePrivate(old.storageKey);
    await audit(user, 'edit', 'document', id, { applicationId: old.applicationId, replaced: true });
    refresh(old.applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function setDocumentVerified(id: string, verified: boolean): Promise<ActionResult> {
  try {
    const user = await staff();
    const doc = await prisma.applicationDocument.update({ where: { id }, data: { verified, verifiedById: verified ? user.id : null, verifiedAt: verified ? new Date() : null } });
    await audit(user, 'edit', 'document', id, { applicationId: doc.applicationId, verified });
    refresh(doc.applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

type FormInput = Record<string, string | FileRef[] | undefined>;

const optional = z.string().trim().max(3000).optional().transform((s) => s || null);
const required = z.string({ error: 'Please complete the required fields.' }).trim().min(1, 'Please complete the required fields.').max(300);
const dateString = z.string({ error: 'Please enter the date.' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter the date.').transform((s) => new Date(s));
const optionalDate = z.string().optional().transform((s) => (s ? new Date(s) : null));
const amount = z.string({ error: 'Please enter the amount.' }).transform((s) => Number(s.replace(/\D/g, ''))).refine((n) => Number.isInteger(n) && n >= 0, 'Please enter the amount.');
const optionalAmount = z.string().optional().transform((s) => (s ? Number(s.replace(/\D/g, '')) : null));

const verificationInput = z.object({
  visitDate: optionalDate,
  visitedBy: optional,
  findings: optional,
  documentsVerified: z.string().optional().transform((s) => s === 'yes'),
  recommendation: optional,
  decision: z.enum(['ACCEPTED', 'WAITING_LIST', 'NOT_ACCEPTED']).optional().or(z.literal('').transform(() => undefined)),
  decisionReason: optional,
});

export async function saveVerification(applicationId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const data = verificationInput.parse(input);
    if (data.decision === 'NOT_ACCEPTED' && !data.decisionReason) return { ok: false, error: 'Please give a reason for the decision.' };
    if (data.decision) await checkMove(applicationId, data.decision, user);
    await prisma.verification.upsert({ where: { applicationId }, create: { ...data, applicationId }, update: data });
    await audit(user, 'edit', 'verification', applicationId);
    if (data.decision) await applyStatus(applicationId, data.decision, data.decisionReason, user);
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const visitInput = z.object({ date: dateString, byName: required, type: z.enum(['HOME', 'SCHOOL', 'PHONE', 'FELLOWSHIP']), wellbeing: z.enum(['GOOD', 'FAIR', 'CONCERN']), notes: optional });

export async function addVisit(applicationId: string, childId: string, input: FormInput, token: string | null): Promise<ActionResult> {
  try {
    const user = await staff();
    const { photos, ...rest } = input;
    const data = visitInput.parse(rest);
    const files = await Promise.all(((photos ?? []) as FileRef[]).map((ref) => checkedFile(ref, token)));
    const visit = await prisma.visitLog.create({
      data: { ...data, childId, photos: { create: files.map((f) => ({ ...f, applicationId, type: 'VISIT_PHOTO' as const, uploadedById: user.id })) } },
    });
    await audit(user, 'create', 'visit', visit.id, { applicationId });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const schoolInput = z.object({ schoolYear: required, term: optional, school: required, level: required, feesDue: amount, feesDueDate: optionalDate, results: optional });

export async function addSchoolRecord(applicationId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const record = await prisma.schoolRecord.create({ data: { ...schoolInput.parse(input), applicationId } });
    await audit(user, 'create', 'school-record', record.id, { applicationId });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const paymentInput = z.object({ amount, paidAt: dateString, paidBy: optional });

export async function addFeePayment(applicationId: string, schoolRecordId: string, input: FormInput, token: string | null): Promise<ActionResult> {
  try {
    const user = await staff();
    const { receipt, ...rest } = input;
    const data = paymentInput.parse(rest);
    const [ref] = (receipt ?? []) as FileRef[];
    const document = ref
      ? await prisma.applicationDocument.create({ data: { ...(await checkedFile(ref, token)), applicationId, type: 'FEES_RECEIPT', uploadedById: user.id } })
      : null;
    const payment = await prisma.feePayment.create({ data: { ...data, schoolRecordId, receiptDocumentId: document?.id } });
    await audit(user, 'create', 'fee-payment', payment.id, { applicationId });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const materialInput = z.object({ item: required, givenAt: dateString, value: optionalAmount, givenBy: optional });

export async function addMaterialSupport(applicationId: string, childId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const row = await prisma.materialSupport.create({ data: { ...materialInput.parse(input), childId } });
    await audit(user, 'create', 'material-support', row.id, { applicationId });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function addNote(applicationId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const body = z.string({ error: 'Please write a note.' }).trim().min(1, 'Please write a note.').max(5000).parse(input.body);
    const note = await prisma.internalNote.create({ data: { applicationId, body, authorId: user.id, authorName: user.name } });
    await audit(user, 'create', 'note', note.id, { applicationId });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const blankToNull = z.string().trim().max(300).optional().transform((s) => s || null);
const sponsorInput = z.object({
  fullName: required,
  organisation: blankToNull,
  phone: blankToNull,
  email: z.string().trim().email('Please enter a valid email address.').optional().or(z.literal('').transform(() => undefined)).transform((s) => s || null),
  country: blankToNull,
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE']),
});

export async function saveSponsor(id: string | null, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const data = sponsorInput.parse(input);
    const sponsor = id ? await prisma.sponsor.update({ where: { id }, data }) : await prisma.sponsor.create({ data });
    await audit(user, id ? 'edit' : 'create', 'sponsor', sponsor.id);
    revalidatePath('/admin/sponsorship/sponsors');
    return { ok: true, id: sponsor.id };
  } catch (e) {
    return failed(e);
  }
}

/** One click from a "Become a sponsor" submission to a Sponsor record. */
export async function convertSubmissionToSponsor(submissionId: string): Promise<ActionResult> {
  try {
    const user = await staff();
    const existing = await prisma.sponsor.findUnique({ where: { submissionId } });
    if (existing) return { ok: true, id: existing.id };
    const submission = await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } });
    if (submission.formKey !== 'sponsor') return { ok: false, error: 'Only “Become a sponsor” submissions can be converted.' };
    const d = submission.data as Record<string, unknown>;
    const text = (name: string) => (typeof d[name] === 'string' && d[name] ? (d[name] as string) : null);
    const sponsor = await prisma.sponsor.create({
      data: { fullName: text('full_name') ?? 'Unnamed sponsor', email: text('email'), phone: text('phone'), country: text('location'), organisation: text('organisation'), submissionId },
    });
    await audit(user, 'create', 'sponsor', sponsor.id, { submissionId });
    return { ok: true, id: sponsor.id };
  } catch (e) {
    return failed(e);
  }
}

const sponsorshipInput = z.object({ sponsorId: required, startDate: dateString, feesCommitted: optionalAmount, materialCommitment: optional, frequency: optional });

export async function addSponsorship(applicationId: string, childId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const data = sponsorshipInput.parse(input);
    const sponsorship = await prisma.sponsorship.create({ data: { ...data, childId } });
    await prisma.sponsor.update({ where: { id: data.sponsorId }, data: { status: 'ACTIVE' } });
    await audit(user, 'create', 'sponsorship', sponsorship.id, { applicationId });
    const application = await prisma.childApplication.findUniqueOrThrow({ where: { id: applicationId } });
    if (application.status === 'ACCEPTED') await applyStatus(applicationId, 'SPONSORED', null, user);
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function setSponsorshipStatus(applicationId: string, id: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const status = z.enum(['ACTIVE', 'PAUSED', 'ENDED']).parse(input.status);
    await prisma.sponsorship.update({ where: { id }, data: { status, endDate: status === 'ENDED' ? new Date() : null } });
    await audit(user, 'edit', 'sponsorship', id, { applicationId, status });
    refresh(applicationId);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function addSponsorReport(sponsorId: string, input: FormInput): Promise<ActionResult> {
  try {
    const user = await staff();
    const data = z.object({ term: required, childId: blankToNull, sentAt: optionalDate }).parse(input);
    const report = await prisma.sponsorReport.create({ data: { ...data, sponsorId } });
    await audit(user, 'create', 'sponsor-report', report.id, { sponsorId });
    revalidatePath(`/admin/sponsorship/sponsors/${sponsorId}`);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const positive = z.string().regex(/^\d+$/, 'Please enter a whole number.').transform(Number).refine((n) => n > 0, 'Please enter a number above zero.');
const settingsInput = z.object({ programmeName: required, targetChildren: positive, retentionMonths: positive, recipients: z.string().optional() });

export async function saveProgrammeSettings(input: FormInput): Promise<ActionResult> {
  try {
    const user = await requireCapability('sponsorship-admin');
    const { recipients, ...data } = settingsInput.parse(input);
    const list = (recipients ?? '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (list.some((email) => !z.string().email().safeParse(email).success)) return { ok: false, error: 'Please check the notification email addresses.' };
    await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { ...data, recipients: list } });
    await audit(user, 'edit', 'sponsorship-settings');
    revalidatePath('/admin/sponsorship', 'layout');
    revalidatePath('/community-support/register');
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

/** Keeps only real differences from the defaults, so future wording updates still reach unedited fields. */
export async function saveFieldOverrides(input: FieldOverrides): Promise<ActionResult> {
  try {
    const user = await requireCapability('sponsorship-admin');
    const clean: FieldOverrides = {};
    for (const field of allFields(defaultSteps)) {
      const o = input[field.name];
      if (!o) continue;
      const entry: FieldOverrides[string] = {};
      if (o.label?.trim() && o.label.trim() !== field.label) entry.label = o.label.trim();
      if (o.hint !== undefined && o.hint.trim() !== (field.hint ?? '')) entry.hint = o.hint.trim();
      if (o.options && field.options) {
        const free = field.options.every((x) => x.value === x.label);
        const options = o.options.map((x) => ({ value: x.value.trim(), label: x.label.trim() })).filter((x) => x.value && x.label);
        if (free && field.options.some((x) => x.value === 'Other') && !options.some((x) => x.value === 'Other')) return { ok: false, error: `Please keep “Other” in ${field.label}.` };
        if (!free && (options.length !== field.options.length || options.some((x, i) => x.value !== field.options![i].value))) return { ok: false, error: `The choices for ${field.label} cannot be added or removed.` };
        if (JSON.stringify(options) !== JSON.stringify(field.options)) entry.options = options;
      }
      if (Object.keys(entry).length) clean[field.name] = entry;
    }
    await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { fieldOverrides: clean } });
    await audit(user, 'edit', 'sponsorship-settings', undefined, { fields: Object.keys(clean) });
    revalidatePath('/admin/sponsorship', 'layout');
    revalidatePath('/community-support/register');
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const adminOnly = () => requireCapability('sponsorship-admin');

/** Starts a backup after the response, because it can take minutes. */
export async function backUpNow(): Promise<ActionResult> {
  try {
    const user = await staff();
    const drive = await connectDrive();
    if (!drive) return { ok: false, error: 'Google Drive is not connected yet.' };
    await audit(user, 'backup', 'manual');
    after(() => runBackup(drive, 'MANUAL'));
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function testDriveConnection(): Promise<ActionResult> {
  try {
    await adminOnly();
    const drive = await connectDrive();
    if (!drive) return { ok: false, error: 'Google Drive is not connected yet.' };
    await testConnection(drive);
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

export async function disconnectDrive(): Promise<ActionResult> {
  try {
    const user = await adminOnly();
    await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { googleRefreshToken: null } });
    await audit(user, 'edit', 'google-drive', undefined, { connected: false });
    revalidatePath('/admin/sponsorship/backups');
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

const backupInput = z.object({ keepDailyBackups: positive, encryptBackups: z.enum(['yes', 'no']), driveFolderId: blankToNull });

export async function saveBackupSettings(input: FormInput): Promise<ActionResult> {
  try {
    const user = await adminOnly();
    const { encryptBackups, driveFolderId, ...data } = backupInput.parse(input);
    await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { ...data, encryptBackups: encryptBackups === 'yes', ...(driveFolderId ? { driveFolderId } : {}) } });
    await audit(user, 'edit', 'backup-settings', undefined, { encryptBackups });
    revalidatePath('/admin/sponsorship/backups');
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}

/** Removes a child entirely: database record, private files and Drive folder. A tombstone stops a restore bringing them back. */
export async function deleteChildPermanently(id: string, typedReference: string): Promise<ActionResult> {
  try {
    const user = await adminOnly();
    const application = await prisma.childApplication.findUniqueOrThrow({ where: { id }, include: { documents: true } });
    if (typedReference !== application.reference) return { ok: false, error: 'The reference does not match.' };

    const drive = await connectDrive().catch(() => null);
    const folderToDelete = await deleteApplicationFolder(drive, id, application.documents.map((d) => d.id));
    for (const doc of application.documents) await removePrivate(doc.storageKey);
    if (application.signatureKey) await removePrivate(application.signatureKey);
    await prisma.$transaction([
      prisma.deletionTombstone.create({ data: { reference: application.reference, deletedById: user.id } }),
      prisma.childApplication.delete({ where: { id } }),
      ...(folderToDelete ? [prisma.job.create({ data: { type: 'delete-folder', payload: { id, folderId: folderToDelete } } })] : []),
    ]);
    await audit(user, 'delete', 'application', id, { reference: application.reference });
    revalidatePath('/admin/sponsorship/applications');
    return { ok: true };
  } catch (e) {
    return failed(e);
  }
}
