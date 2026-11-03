import Link from 'next/link';
import { Lock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePage } from '@/lib/permissions';
import { Card, PageTitle } from '@/components/admin/ui';

export default async function FormsList() {
  await requirePage('forms');
  const forms = await prisma.formDefinition.findMany({ orderBy: { name: 'asc' } });
  return (
    <>
      <PageTitle title="Forms" description="Edit form questions, button labels, messages and who receives notifications." />
      <div className="grid gap-3 sm:grid-cols-2">
        {forms.map((f) => (
          <Link key={f.key} href={`/admin/forms/${f.key}`}>
            <Card className="h-full transition hover:border-gold/50">
              <h2 className="flex items-center gap-2 text-base text-navy">
                {f.restricted && <Lock className="h-4 w-4 text-gold-deep" />}
                {f.name}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {(f.fields as unknown[]).length} fields · button “{f.submitLabel}”
              </p>
              <p className="mt-1 text-xs text-ink/45">Notifications: {f.recipients.length ? f.recipients.join(', ') : 'default email (Site settings)'}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
