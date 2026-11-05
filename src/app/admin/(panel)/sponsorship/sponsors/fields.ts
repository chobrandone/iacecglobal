import type { SponsorStatus } from '@prisma/client';
import type { QuickField } from '@/components/sponsorship/QuickForm';

export const sponsorStatusLabels: Record<SponsorStatus, string> = { PROSPECT: 'Prospect', ACTIVE: 'Active', INACTIVE: 'Inactive' };

export const sponsorFields: QuickField[] = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'organisation', label: 'Organisation' },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email' },
  { name: 'country', label: 'Country' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: Object.entries(sponsorStatusLabels).map(([value, label]) => ({ value, label })) },
];
