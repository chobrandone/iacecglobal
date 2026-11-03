'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/content';
import { sendMail } from '@/lib/email';
import { EMAIL_RE, cleanSubmission, validateSubmission, type FormField } from '@/lib/forms';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;

async function clientFingerprint() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const ipHash = createHash('sha256')
    .update(ip + (process.env.AUTH_SECRET ?? ''))
    .digest('hex')
    .slice(0, 32);
  return { ipHash, userAgent: (h.get('user-agent') ?? '').slice(0, 300) };
}

async function rateLimited(ipHash: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [subs, news] = await Promise.all([
    prisma.submission.count({ where: { ipHash, createdAt: { gte: since } } }),
    prisma.subscriber.count({ where: { ipHash, createdAt: { gte: since } } }),
  ]);
  return subs + news >= MAX_PER_WINDOW;
}

export type SubmitResult = { ok: true } | { ok: false; errors?: Record<string, string>; message?: string };

export async function submitForm(formKey: string, values: Record<string, unknown>): Promise<SubmitResult> {
  const def = await prisma.formDefinition.findUnique({ where: { key: formKey } });
  if (!def) return { ok: false, message: 'This form is not available.' };

  // Honeypot: pretend success so bots learn nothing.
  if (typeof values.__trap === 'string' && values.__trap.length > 0) return { ok: true };

  const fields = def.fields as unknown as FormField[];
  const errors = validateSubmission(fields, values);
  if (Object.keys(errors).length) return { ok: false, errors };

  const { ipHash, userAgent } = await clientFingerprint();
  if (await rateLimited(ipHash)) {
    return { ok: false, message: 'Too many submissions from your connection. Please wait a few minutes and try again.' };
  }

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

  await Promise.allSettled([
    sendMail({
      to: recipients,
      subject: `New ${def.name} submission`,
      text: lines.join('\n'),
      replyTo: def.restricted ? undefined : submitterEmail,
    }),
    def.autoReply && submitterEmail
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
  if (await rateLimited(ipHash)) return { ok: false };
  await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: parsed.data.source, ipHash },
    update: {},
  });
  return { ok: true };
}
