import type { ApplicationStatus, Prisma } from '@prisma/client';
import { statusLabels } from './format';

export type ApplicationFilters = Partial<Record<'q' | 'status' | 'gender' | 'minAge' | 'maxAge' | 'school' | 'referrer' | 'docs' | 'from' | 'to', string>>;

const yearsAgo = (years: number) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
};

/** The list's filters as a query, shared with the exports so "export" means what is on screen. */
export function applicationWhere(s: ApplicationFilters): Prisma.ChildApplicationWhereInput {
  const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });
  const child: Prisma.ChildWhereInput = {
    ...(s.gender === 'MALE' || s.gender === 'FEMALE' ? { gender: s.gender } : {}),
    ...(s.minAge || s.maxAge
      ? {
          dateOfBirth: {
            ...(s.minAge ? { lte: yearsAgo(Number(s.minAge)) } : {}),
            ...(s.maxAge ? { gt: yearsAgo(Number(s.maxAge) + 1) } : {}),
          },
        }
      : {}),
  };
  return {
    ...(s.status && s.status in statusLabels ? { status: s.status as ApplicationStatus } : {}),
    ...(Object.keys(child).length ? { child } : {}),
    ...(s.school ? { schoolRecords: { some: { school: contains(s.school) } } } : {}),
    ...(s.referrer ? { referral: { referredBy: contains(s.referrer) } } : {}),
    ...(s.docs === 'yes' ? { documentsComplete: true } : s.docs === 'no' ? { documentsComplete: false } : {}),
    ...(s.from || s.to
      ? { createdAt: { ...(s.from ? { gte: new Date(s.from) } : {}), ...(s.to ? { lt: new Date(new Date(s.to).getTime() + 86_400_000) } : {}) } }
      : {}),
    ...(s.q
      ? { OR: [{ reference: contains(s.q) }, { child: { fullName: contains(s.q) } }, { caretaker: { fullName: contains(s.q) } }] }
      : {}),
  };
}
