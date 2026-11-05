import type { ApplicationStatus } from '@prisma/client';

/** The normal route. An Administrator may also make any other move, to correct a mistake. */
export const nextStatuses: Record<ApplicationStatus, ApplicationStatus[]> = {
  NEW: ['CONTACTED'],
  CONTACTED: ['VISIT_SCHEDULED'],
  VISIT_SCHEDULED: ['VERIFIED'],
  VERIFIED: ['ACCEPTED', 'WAITING_LIST', 'NOT_ACCEPTED'],
  ACCEPTED: ['SPONSORED', 'WAITING_LIST', 'EXITED'],
  WAITING_LIST: ['ACCEPTED', 'NOT_ACCEPTED'],
  NOT_ACCEPTED: [],
  SPONSORED: ['EXITED'],
  EXITED: [],
};

export const canMove = (from: ApplicationStatus, to: ApplicationStatus, isAdministrator: boolean) => from !== to && (isAdministrator || nextStatuses[from].includes(to));

export const exitReasons = ['Graduated', 'Moved', 'Other'];

/** Applications still being worked on, as opposed to closed ones. */
export const closedStatuses: ApplicationStatus[] = ['NOT_ACCEPTED', 'EXITED'];
