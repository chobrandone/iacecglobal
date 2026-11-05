import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import type { FieldOverrides } from '@/lib/sponsorship/fields';
import { allStepIds } from '@/lib/sponsorship/mapping';
import { ApplicationForm } from '@/components/sponsorship/ApplicationForm';
import { PageTitle } from '@/components/admin/ui';
import { createPaperApplication } from '../../_actions';

export default async function NewApplicationPage() {
  await requirePage('sponsorship');
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  return (
    <>
      <PageTitle title="New application" description="Enter a paper form. Add the scanned documents on the Documents tab after saving." />
      <ApplicationForm
        stepIds={allStepIds}
        initial={{ completed_by: 'IACEC_MEMBER' }}
        overrides={(settings?.fieldOverrides ?? {}) as FieldOverrides}
        save={createPaperApplication}
        submitLabel="Save application"
        redirectTo="/admin/sponsorship/applications/[id]?tab=documents"
      />
    </>
  );
}
