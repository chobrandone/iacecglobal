import type { SubmissionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@/lib/db';
import type { FormField } from '@/lib/forms';
import { currentUser, readableFormKeys } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const url = new URL(req.url);
  const formKey = url.searchParams.get('form');
  const status = url.searchParams.get('status') as SubmissionStatus | null;
  const allowed = await readableFormKeys(user.role);
  if (!formKey || !allowed.includes(formKey)) return NextResponse.json({ error: 'Choose a form you have access to.' }, { status: 403 });

  const def = await prisma.formDefinition.findUniqueOrThrow({ where: { key: formKey } });
  const fields = def.fields as unknown as FormField[];
  const subs = await prisma.submission.findMany({
    where: { formKey, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  const csv = toCsv(
    ['Received', 'Status', ...fields.map((f) => f.label), 'Internal notes'],
    subs.map((s) => {
      const data = s.data as Record<string, unknown>;
      return [
        s.createdAt.toISOString(),
        s.status,
        ...fields.map((f) => (typeof data[f.name] === 'boolean' ? (data[f.name] ? 'Yes' : 'No') : (data[f.name] as string))),
        s.notes,
      ];
    }),
  );
  return csvResponse(`${formKey}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
