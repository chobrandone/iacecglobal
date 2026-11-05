import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from './db';

export type Capability = 'content' | 'media' | 'submissions' | 'sponsorship' | 'sponsorship-admin' | 'forms' | 'subscribers' | 'settings' | 'users';

const capabilities: Record<Role, Capability[]> = {
  ADMIN: ['content', 'media', 'submissions', 'sponsorship', 'sponsorship-admin', 'forms', 'subscribers', 'settings', 'users'],
  EDITOR: ['content', 'media'],
  SPONSORSHIP_COORDINATOR: ['sponsorship'],
};

export function can(role: Role, cap: Capability) {
  return capabilities[role].includes(cap);
}

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrator',
  EDITOR: 'Editor',
  SPONSORSHIP_COORDINATOR: 'Sponsorship Coordinator',
};

/** Loads the signed-in user from the database (so deactivation and role changes apply immediately). */
export async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  return user?.active ? user : null;
}

/** For pages: redirects to login, or to the dashboard when the role lacks the capability. */
export async function requirePage(cap?: Capability) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (cap && !can(user.role, cap)) redirect('/admin?denied=1');
  return user;
}

/** For server actions and route handlers: throws when not allowed. */
export async function requireCapability(cap: Capability) {
  const user = await currentUser();
  if (!user) throw new Error('You are not signed in.');
  if (!can(user.role, cap)) throw new Error('You do not have permission to do this.');
  return user;
}

/** Which forms' submissions a role may read. Child applications: ADMIN + coordinator only. */
export async function readableFormKeys(role: Role) {
  const forms = await prisma.formDefinition.findMany({ select: { key: true, sponsorship: true, restricted: true } });
  if (role === 'ADMIN') return forms.map((f) => f.key);
  if (role === 'SPONSORSHIP_COORDINATOR') return forms.filter((f) => f.sponsorship || f.restricted).map((f) => f.key);
  return [];
}

export async function logActivity(userId: string, action: string, entity: string, entityId?: string, label?: string) {
  await prisma.activityLog.create({ data: { userId, action, entity, entityId, label } }).catch(() => undefined);
}
