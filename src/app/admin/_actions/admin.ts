'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { Prisma, type Role, type SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/email';
import { formFieldSchema } from '@/lib/forms';
import { currentUser, logActivity, readableFormKeys, requireCapability } from '@/lib/permissions';
import { removeFile } from '@/lib/storage';

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues.map((i) => i.message).join(' · ') };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { ok: false, error: 'That value is already in use.' };
  return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
}

// ─── Sign in / out ──────────────────────────────────────────────────────

export async function login(_: unknown, formData: FormData): Promise<{ error?: string }> {
  const next = String(formData.get('next') || '/admin');
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: 'The email or password is not correct, or the account is inactive.' };
    throw e;
  }
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  await signOut({ redirectTo: '/admin/login' });
}

export async function changeOwnPassword(input: { current: string; next: string }): Promise<ActionResult> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('You are not signed in.');
    const next = z.string().min(10, 'Use at least 10 characters.').parse(input.next);
    if (!(await bcrypt.compare(input.current, user.passwordHash))) throw new Error('Your current password is not correct.');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Media ──────────────────────────────────────────────────────────────

export async function updateMedia(id: string, input: { alt: string; focalX: number; focalY: number }): Promise<ActionResult> {
  try {
    await requireCapability('media');
    const data = z
      .object({ alt: z.string().max(300), focalX: z.number().int().min(0).max(100), focalY: z.number().int().min(0).max(100) })
      .parse(input);
    await prisma.media.update({ where: { id }, data });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    const user = await requireCapability('media');
    const media = await prisma.media.findUniqueOrThrow({ where: { id } });
    await removeFile(media.key);
    await prisma.media.delete({ where: { id } });
    await logActivity(user.id, 'deleted', 'media', id, media.filename);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function listMedia(query = '', take = 60) {
  await requireCapability('media');
  return prisma.media.findMany({
    where: query ? { OR: [{ filename: { contains: query, mode: 'insensitive' } }, { alt: { contains: query, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'desc' },
    take,
  });
}

// ─── Submissions ────────────────────────────────────────────────────────

async function assertCanRead(submissionId: string) {
  const user = await currentUser();
  if (!user) throw new Error('You are not signed in.');
  const sub = await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } });
  const keys = await readableFormKeys(user.role);
  if (!keys.includes(sub.formKey)) throw new Error('You do not have permission to see this submission.');
  return { user, sub };
}

export async function updateSubmission(id: string, input: { status: SubmissionStatus; notes: string }): Promise<ActionResult> {
  try {
    const { user } = await assertCanRead(id);
    const data = z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED']), notes: z.string().max(5000) }).parse(input);
    await prisma.submission.update({ where: { id }, data });
    await logActivity(user.id, 'updated', 'submission', id, data.status);
    revalidatePath('/admin/submissions');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSubmission(id: string): Promise<ActionResult> {
  try {
    const { user } = await assertCanRead(id);
    await prisma.submission.delete({ where: { id } });
    await logActivity(user.id, 'deleted', 'submission', id);
    revalidatePath('/admin/submissions');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Form builder ───────────────────────────────────────────────────────

const formInput = z.object({
  name: z.string().min(1),
  submitLabel: z.string().min(1),
  successTitle: z.string().min(1),
  successBody: z.string(),
  note: z.string().nullable(),
  errorMessage: z.string().min(1),
  recipients: z.array(z.string().email('Each recipient must be a valid email address.')),
  autoReply: z.boolean(),
  autoReplySubject: z.string(),
  autoReplyBody: z.string(),
  fields: z.array(formFieldSchema).min(1),
});

export async function saveFormDefinition(key: string, input: z.infer<typeof formInput>): Promise<ActionResult> {
  try {
    const user = await requireCapability('forms');
    const data = formInput.parse(input);
    const names = data.fields.map((f) => f.name);
    if (new Set(names).size !== names.length) throw new Error('Two fields share the same field name.');
    await prisma.formDefinition.update({ where: { key }, data: { ...data, note: data.note || null, fields: data.fields as Prisma.InputJsonValue } });
    await logActivity(user.id, 'updated', 'form', key, data.name);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Subscribers ────────────────────────────────────────────────────────

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  try {
    await requireCapability('subscribers');
    await prisma.subscriber.delete({ where: { id } });
    revalidatePath('/admin/subscribers');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Users ──────────────────────────────────────────────────────────────

const roleSchema = z.enum(['ADMIN', 'EDITOR', 'SPONSORSHIP_COORDINATOR']);

function tempPassword() {
  return randomBytes(9).toString('base64url');
}

export async function inviteUser(input: { name: string; email: string; role: Role }): Promise<ActionResult<{ password: string }>> {
  try {
    const admin = await requireCapability('users');
    const data = z.object({ name: z.string().min(1), email: z.string().email(), role: roleSchema }).parse(input);
    const password = tempPassword();
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email.toLowerCase(), role: data.role, passwordHash: await bcrypt.hash(password, 12) },
    });
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://iacecglobal.com';
    await sendMail({
      to: user.email,
      subject: 'Your IACEC website account',
      text: `Hello ${user.name},\n\nAn account has been created for you on the IACEC website admin.\n\nSign in at ${site}/admin/login\nEmail: ${user.email}\nTemporary password: ${password}\n\nPlease change your password after signing in (Account page).`,
    });
    await logActivity(admin.id, 'invited', 'user', user.id, user.email);
    revalidatePath('/admin/users');
    return { ok: true, data: { password } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUser(id: string, input: { role: Role; active: boolean; name: string }): Promise<ActionResult> {
  try {
    const admin = await requireCapability('users');
    const data = z.object({ role: roleSchema, active: z.boolean(), name: z.string().min(1) }).parse(input);
    if (id === admin.id && (data.role !== 'ADMIN' || !data.active)) throw new Error('You cannot remove your own administrator access.');
    if (data.role !== 'ADMIN' || !data.active) {
      const otherAdmins = await prisma.user.count({ where: { role: 'ADMIN', active: true, id: { not: id } } });
      if (otherAdmins === 0) throw new Error('At least one active administrator is required.');
    }
    await prisma.user.update({ where: { id }, data });
    await logActivity(admin.id, 'updated', 'user', id, `${data.role}${data.active ? '' : ' (inactive)'}`);
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resetUserPassword(id: string): Promise<ActionResult<{ password: string }>> {
  try {
    const admin = await requireCapability('users');
    const password = tempPassword();
    const user = await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
    await sendMail({
      to: user.email,
      subject: 'Your IACEC password was reset',
      text: `Hello ${user.name},\n\nYour IACEC admin password was reset by an administrator.\nTemporary password: ${password}\n\nPlease sign in and change it on the Account page.`,
    });
    await logActivity(admin.id, 'reset password', 'user', id, user.email);
    return { ok: true, data: { password } };
  } catch (e) {
    return fail(e);
  }
}
