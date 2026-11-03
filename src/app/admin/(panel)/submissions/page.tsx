import Link from 'next/link';
import type { SubmissionStatus } from '@prisma/client';
import { Download, Lock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { readableFormKeys, requirePage } from '@/lib/permissions';
import { Badge, Button, Card, PageTitle } from '@/components/admin/ui';
import { SubmissionFilters } from './SubmissionFilters';

const statusLabel: Record<SubmissionStatus, string> = { NEW: 'New', IN_PROGRESS: 'In progress', DONE: 'Done', ARCHIVED: 'Archived' };
const statusTone: Record<SubmissionStatus, 'gold' | 'default' | 'green' | 'muted'> = { NEW: 'gold', IN_PROGRESS: 'default', DONE: 'green', ARCHIVED: 'muted' };

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ form?: string; status?: string; q?: string }> }) {
  const user = await requirePage('sponsorship');
  const sp = await searchParams;
  const keys = await readableFormKeys(user.role);
  const forms = await prisma.formDefinition.findMany({ where: { key: { in: keys } }, select: { key: true, name: true, restricted: true }, orderBy: { name: 'asc' } });
  const formKey = sp.form && keys.includes(sp.form) ? sp.form : undefined;
  const status = sp.status && sp.status in statusLabel ? (sp.status as SubmissionStatus) : undefined;

  const subs = await prisma.submission.findMany({
    where: {
      formKey: formKey ? formKey : { in: keys },
      ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const q = (sp.q ?? '').toLowerCase();
  const filtered = q ? subs.filter((s) => JSON.stringify(s.data).toLowerCase().includes(q)) : subs;
  const formName = (key: string) => forms.find((f) => f.key === key)?.name ?? key;
  const restricted = (key: string) => forms.find((f) => f.key === key)?.restricted;

  const summary = (data: Record<string, unknown>) =>
    String(data.full_name || data.child_full_name || data.guardian_full_name || data.email || '—');

  return (
    <>
      <PageTitle
        title="Submissions"
        description="Everything sent through the website's forms."
        actions={
          formKey ? (
            <a href={`/api/admin/submissions/export?form=${formKey}${status ? `&status=${status}` : ''}`}>
              <Button variant="outline">
                <Download className="h-4 w-4" /> Export CSV (Excel)
              </Button>
            </a>
          ) : (
            <p className="text-xs text-ink/50">Choose a form to export its submissions.</p>
          )
        }
      />
      <SubmissionFilters forms={forms.map((f) => ({ value: f.key, label: f.name }))} form={formKey ?? ''} status={status ?? ''} q={sp.q ?? ''} />
      <Card className="mt-4 overflow-hidden p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">No submissions match.</p>
        ) : (
          <ul className="divide-y divide-navy/[0.06]">
            {filtered.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/submissions/${s.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-mist/60 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                      {restricted(s.formKey) && <Lock className="h-3.5 w-3.5 text-gold-deep" aria-label="Confidential" />}
                      {summary(s.data as Record<string, unknown>)}
                    </span>
                    <span className="block text-xs text-ink/50">{formName(s.formKey)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge>
                    <time className="text-xs text-ink/45">{s.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
