'use server';

import { headers } from 'next/headers';
import { after } from 'next/server';
import type { DocumentType, Prisma } from '@prisma/client';
import { clientFingerprint, clientIp } from '@/lib/client-fingerprint';
import { getSettings } from '@/lib/content';
import { prisma } from '@/lib/db';
import { checkFormToken, checkTurnstile, mayAutoReply, mayNotifyStaff, withinSubmissionLimits, type FormGuard } from '@/lib/form-guard';
import { processJobs, queueSync } from '@/lib/drive/jobs';
import { allFields, withOverrides, type FieldOverrides, type FileRef, type Values } from '@/lib/sponsorship/fields';
import { createData, toRecords } from '@/lib/sponsorship/mapping';
import { notifyNewApplication } from '@/lib/sponsorship/notify';
import { nextReference } from '@/lib/sponsorship/reference';
import { validateAll, type Errors } from '@/lib/sponsorship/schema';
import { verifyUpload } from '@/lib/sponsorship/storage';

export type SubmitResult = { ok: true; reference: string } | { ok: false; errors?: Errors; firstStep?: number | null; message?: string };

export async function submitApplication(values: Values, token: string | null, trap: string, guard: FormGuard = {}): Promise<SubmitResult> {
  if (trap) return { ok: true, reference: '' }; // Honeypot: pretend success so bots learn nothing.

  const row = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const steps = withOverrides((row?.fieldOverrides ?? {}) as FieldOverrides);
  const { errors, firstStep } = validateAll(steps, values);
  if (Object.keys(errors).length) return { ok: false, errors, firstStep };

  if (!(await checkFormToken(guard.token))) return { ok: false, message: 'Please wait a moment and press submit again.' };
  if (!(await checkTurnstile(guard.turnstile, clientIp(await headers())))) return { ok: false, message: 'Please complete the security check.' };

  const { ipHash } = await clientFingerprint();
  if (!(await withinSubmissionLimits(ipHash))) return { ok: false, message: 'Too many applications from your connection. Please wait a few minutes and try again.' };

  // Every file must belong to this form's upload session and really be an image or PDF.
  const session = token ? await prisma.uploadSession.findUnique({ where: { token } }) : null;
  const fileFields = allFields(steps).filter((f) => f.type === 'file' || f.type === 'signature');
  const documents: Prisma.ApplicationDocumentCreateWithoutApplicationInput[] = [];
  const fileErrors: Errors = {};
  let signatureKey: string | null = null;
  for (const field of fileFields) {
    for (const ref of (values[field.name] ?? []) as FileRef[]) {
      const checked = session?.keys.includes(ref.key) ? await verifyUpload(ref.key) : null;
      if (!checked) {
        fileErrors[field.name] = 'This file could not be read. Please remove it and add it again.';
        continue;
      }
      if (field.type === 'signature') signatureKey = ref.key;
      else documents.push({ type: field.docType as DocumentType, storageKey: ref.key, filename: ref.filename, mimeType: checked.mimeType, size: checked.size });
    }
  }
  if (Object.keys(fileErrors).length) {
    const index = steps.findIndex((s) => s.groups.some((g) => g.fields.some((f) => f.name in fileErrors)));
    return { ok: false, errors: fileErrors, firstStep: index };
  }
  const documentsComplete = fileFields.filter((f) => f.type === 'file').every((f) => ((values[f.name] ?? []) as FileRef[]).length > 0);

  const records = toRecords(values);
  const application = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(tx);
    return tx.childApplication.create({
      data: {
        ...createData(records),
        reference,
        ipHash,
        documentsComplete,
        signatureKey,
        documents: { create: documents },
        statusChanges: { create: { to: 'NEW', userName: 'Public form' } },
      },
    });
  });

  const h = await headers();
  await prisma.auditLog.create({
    data: {
      userName: 'Public form',
      action: 'create',
      entity: 'application',
      entityId: application.id,
      ip: clientIp(h),
      userAgent: h.get('user-agent')?.slice(0, 300),
    },
  });
  if (session) await prisma.uploadSession.delete({ where: { id: session.id } });

  const settings = await getSettings();
  const [notifyStaff, replyToCaretaker] = await Promise.all([mayNotifyStaff(), records.caretaker.email ? mayAutoReply(records.caretaker.email) : false]);
  await notifyNewApplication(
    {
      reference: application.reference,
      caretakerEmail: replyToCaretaker ? records.caretaker.email : null,
      notifyStaff,
      programmeName: row?.programmeName ?? 'Child Sponsorship Programme',
      recipients: row?.recipients.length ? row.recipients : [settings.notificationEmail || settings.email],
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || settings.siteUrl,
    },
    records.caretaker.phones[0],
  );

  // After the response, so a Drive outage can never block the form.
  after(async () => {
    await queueSync(application.id);
    await processJobs();
  });

  return { ok: true, reference: application.reference };
}
