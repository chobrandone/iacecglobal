'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { clientFingerprint, clientIp } from '@/lib/client-fingerprint';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/content';
import { sendMail } from '@/lib/email';
import { checkFormToken, checkTurnstile, issueFormToken, looksLikeSpam, mayAutoReply, mayNotifyStaff, withinSubmissionLimits, type FormGuard } from '@/lib/form-guard';
import { EMAIL_RE, cleanSubmission, validateSubmission, type FormField } from '@/lib/forms';
import { DAY, MINUTE, hit } from '@/lib/rate-limit';

export type SubmitResult = { ok: true } | { ok: false; errors?: Record<string, string>; message?: string };

/** Handed to a form when it opens. See checkFormToken. */
export async function getFormToken() {
  return issueFormToken();
}

const STALE = 'Please wait a moment and press send again.';

export async function submitForm(formKey: string, values: Record<string, unknown>, guard: FormGuard = {}): Promise<SubmitResult> {
  const def = await prisma.formDefinition.findUnique({ where: { key: formKey } });
  if (!def) return { ok: false, message: 'This form is not available.' };

  // Honeypot: pretend success so bots learn nothing.
  if (typeof values.__trap === 'string' && values.__trap.length > 0) return { ok: true };

  const fields = def.fields as unknown as FormField[];
  const errors = validateSubmission(fields, values);
  if (Object.keys(errors).length) return { ok: false, errors };

  if (!(await checkFormToken(guard.token))) return { ok: false, message: STALE };
  if (!(await checkTurnstile(guard.turnstile, clientIp(await headers())))) return { ok: false, message: 'Please complete the security check.' };

  const { ipHash, userAgent } = await clientFingerprint();
  if (!(await withinSubmissionLimits(ipHash))) {
    return { ok: false, message: 'Too many submissions from your connection. Please wait a few minutes and try again.' };
  }
  if (looksLikeSpam(values)) return { ok: true }; // Pretend success, as with the honeypot.

  const data = cleanSubmission(fields, values);
  await prisma.submission.create({ data: { formKey, data, ipHash, userAgent } });

  const settings = await getSettings();
  const recipients = def.recipients.length ? def.recipients : [settings.notificationEmail || settings.email];
  // Child sponsorship applications never travel by email in full — staff read them in the admin.
  const lines = def.restricted
    ? ['A new confidential submission has been received.', 'Sign in to the IACEC admin to read it.']
    : fields.map((f) => `${f.label}: ${typeof data[f.name] === 'boolean' ? (data[f.name] ? 'Yes' : 'No') : data[f.name] || '—'}`);

  const submitterEmail = [data.email, data.guardian_email].find((v) => typeof v === 'string' && EMAIL_RE.test(v)) as
    | string
    | undefined;

  const [notifyStaff, autoReply] = await Promise.all([mayNotifyStaff(), def.autoReply && submitterEmail ? mayAutoReply(submitterEmail) : false]);
  await Promise.allSettled([
    notifyStaff
      ? sendMail({
          to: recipients,
          subject: `New ${def.name} submission`,
          text: lines.join('\n'),
          replyTo: def.restricted ? undefined : submitterEmail,
        })
      : Promise.resolve(false),
    autoReply && submitterEmail
      ? sendMail({
          to: submitterEmail,
          subject: def.autoReplySubject,
          text: `${def.autoReplyBody}\n\n— ${settings.organisationName}\n${settings.email}`,
        })
      : Promise.resolve(true),
  ]);

  return { ok: true };
}

const subscribeSchema = z.object({ email: z.string().trim().toLowerCase().regex(EMAIL_RE), source: z.string().max(60).optional() });

export async function subscribe(input: { email: string; source?: string; __trap?: string }): Promise<{ ok: boolean }> {
  if (input.__trap) return { ok: true };
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { ipHash } = await clientFingerprint();
  if (!(await hit(`newsletter:ip:${ipHash}`, 6, 10 * MINUTE)) || !(await hit('newsletter:all-day', 200, DAY))) return { ok: false };
  await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: parsed.data.source, ipHash },
    update: {},
  });
  return { ok: true };
}
