import type { ApplicationStatus, VisitType, Wellbeing } from '@prisma/client';

export const statusLabels: Record<ApplicationStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  VISIT_SCHEDULED: 'Home visit scheduled',
  VERIFIED: 'Verified',
  ACCEPTED: 'Accepted',
  WAITING_LIST: 'Waiting list',
  NOT_ACCEPTED: 'Not accepted',
  SPONSORED: 'Sponsored',
  EXITED: 'Exited',
};

export const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

export const statusTone: Record<ApplicationStatus, 'default' | 'gold' | 'green' | 'red' | 'muted'> = {
  NEW: 'gold',
  CONTACTED: 'default',
  VISIT_SCHEDULED: 'default',
  VERIFIED: 'default',
  ACCEPTED: 'green',
  WAITING_LIST: 'muted',
  NOT_ACCEPTED: 'red',
  SPONSORED: 'green',
  EXITED: 'muted',
};

export const visitTypeLabels: Record<VisitType, string> = { HOME: 'Home', SCHOOL: 'School', PHONE: 'Phone', FELLOWSHIP: 'Fellowship' };
export const wellbeingLabels: Record<Wellbeing, string> = { GOOD: 'Good', FAIR: 'Fair', CONCERN: 'Concern' };

const TIME_ZONE = 'Africa/Douala';

export const formatDate = (d?: Date | null) => (d ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: TIME_ZONE }).format(d) : '—');
export const formatDateTime = (d?: Date | null) => (d ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }).format(d) : '—');
export const formatFcfa = (n?: number | null) => (n === null || n === undefined ? '—' : `${new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, ' ')} FCFA`);

export function ageOf(dateOfBirth: Date, today = new Date()) {
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < dateOfBirth.getUTCMonth() || (today.getUTCMonth() === dateOfBirth.getUTCMonth() && today.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
