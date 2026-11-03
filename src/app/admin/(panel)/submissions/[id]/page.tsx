import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { prisma } from '@/lib/db';
import type { FormField } from '@/lib/forms';
import { readableFormKeys, requirePage } from '@/lib/permissions';
import { Card } from '@/components/admin/ui';
import { SubmissionActions } from './SubmissionActions';

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('sponsorship');
  const { id } = await params;
  const sub = await prisma.submission.findUnique({ where: { id } });
  if (!sub) notFound();
  if (!(await readableFormKeys(user.role)).includes(sub.formKey)) redirect('/admin/submissions');
  const def = await prisma.formDefinition.findUnique({ where: { key: sub.formKey } });
  const fields = (def?.fields as unknown as FormField[]) ?? [];
  const data = sub.data as Record<string, unknown>;
  const extra = Object.keys(data).filter((k) => !fields.some((f) => f.name === k));

  const show = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '') || '—');

  return (
    <>
      <Link href="/admin/submissions" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Submissions
      </Link>
      <h1 className="text-[1.6rem] text-navy">{def?.name ?? sub.formKey}</h1>
      <p className="mb-6 text-sm text-ink/55">Received {sub.createdAt.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
      {def?.restricted && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-gold-tint px-4 py-2 text-sm text-gold-deep">
          <Lock className="h-4 w-4" /> Confidential child information. Do not copy, forward or publish.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <dl className="divide-y divide-navy/[0.06]">
            {[...fields.map((f) => ({ label: f.label, name: f.name })), ...extra.map((k) => ({ label: k, name: k }))].map((f) => (
              <div key={f.name} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">{f.label}</dt>
                <dd className="whitespace-pre-wrap break-words text-sm text-ink">
                  {f.name === 'email' || f.name === 'guardian_email' ? (
                    data[f.name] ? (
                      <a className="text-navy underline" href={`mailto:${data[f.name]}`}>
                        {String(data[f.name])}
                      </a>
                    ) : (
                      '—'
                    )
                  ) : (
                    show(data[f.name])
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
        <SubmissionActions id={sub.id} status={sub.status} notes={sub.notes ?? ''} />
      </div>
    </>
  );
}
