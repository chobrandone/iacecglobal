import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { UsersManager } from './UsersManager';

export default async function UsersPage() {
  const me = await requirePage('users');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return (
    <UsersManager
      meId={me.id}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      }))}
    />
  );
}
