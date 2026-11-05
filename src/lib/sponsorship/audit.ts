import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { clientIp } from '@/lib/client-fingerprint';
import { prisma } from '@/lib/db';

export type AuditAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'download' | 'status' | 'restore' | 'backup';

/**
 * Records who touched child data, what they did, when, and from which IP address. Unlike
 * logActivity this does not swallow errors: if the entry cannot be written, the access stops.
 */
export async function audit(
  user: { id: string; name: string },
  action: AuditAction,
  entity: string,
  entityId?: string,
  detail?: Prisma.InputJsonValue,
) {
  const h = await headers();
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action,
      entity,
      entityId,
      detail,
      ip: clientIp(h),
      userAgent: h.get('user-agent')?.slice(0, 300),
    },
  });
}
