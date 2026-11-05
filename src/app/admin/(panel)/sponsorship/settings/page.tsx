import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { steps, type FieldOverrides } from '@/lib/sponsorship/fields';
import { FieldOverridesEditor, type EditableStep } from '@/components/sponsorship/FieldOverridesEditor';
import { QuickForm } from '@/components/sponsorship/QuickForm';
import { Card, PageTitle } from '@/components/admin/ui';
import { saveFieldOverrides, saveProgrammeSettings } from '../_actions';

export default async function SponsorshipSettingsPage() {
  await requirePage('sponsorship-admin');
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const editable: EditableStep[] = steps.map((s) => ({
    id: s.id,
    title: s.title,
    fields: s.groups.flatMap((g) =>
      g.fields.map((f) => ({ name: f.name, label: f.label, hint: f.hint ?? '', group: g.title ?? '', options: f.options ?? [], freeOptions: !!f.options?.length && f.options.every((o) => o.value === o.label) })),
    ),
  }));

  return (
    <>
      <PageTitle title="Programme settings" description="Only Administrators can see this page." />
      <div className="space-y-4">
        <Card>
          <QuickForm
            keep
            submitLabel="Save settings"
            fields={[
              { name: 'programmeName', label: 'Programme name', required: true, wide: true },
              { name: 'targetChildren', label: 'Target number of children', type: 'number', required: true },
              { name: 'retentionMonths', label: 'Keep records for (months)', type: 'number', required: true },
              { name: 'recipients', label: 'Notification emails (one per line)', type: 'textarea' },
            ]}
            initial={{
              programmeName: settings?.programmeName ?? 'Child Sponsorship Programme',
              targetChildren: String(settings?.targetChildren ?? 12),
              retentionMonths: String(settings?.retentionMonths ?? 84),
              recipients: (settings?.recipients ?? []).join('\n'),
            }}
            action={saveProgrammeSettings}
          />
        </Card>
        <Card>
          <h2 className="text-base text-navy">Form wording and choices</h2>
          <p className="mt-1 text-sm text-ink/60">Change labels, help text and dropdown choices. New questions need a developer, because answers are stored in fixed places.</p>
          <div className="mt-4">
            <FieldOverridesEditor steps={editable} initial={(settings?.fieldOverrides ?? {}) as FieldOverrides} save={saveFieldOverrides} />
          </div>
        </Card>
      </div>
    </>
  );
}
