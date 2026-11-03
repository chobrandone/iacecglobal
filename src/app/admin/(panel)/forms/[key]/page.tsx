import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { FormField } from '@/lib/forms';
import { requirePage } from '@/lib/permissions';
import { FormBuilder } from './FormBuilder';

export default async function EditForm({ params }: { params: Promise<{ key: string }> }) {
  await requirePage('forms');
  const { key } = await params;
  const def = await prisma.formDefinition.findUnique({ where: { key } });
  if (!def) notFound();
  return (
    <FormBuilder
      key={def.updatedAt.toISOString()}
      formKey={def.key}
      initial={{
        name: def.name,
        submitLabel: def.submitLabel,
        successTitle: def.successTitle,
        successBody: def.successBody,
        note: def.note ?? '',
        errorMessage: def.errorMessage,
        recipients: def.recipients.join('\n'),
        autoReply: def.autoReply,
        autoReplySubject: def.autoReplySubject,
        autoReplyBody: def.autoReplyBody,
        fields: (def.fields as unknown as FormField[]).map((f) => ({ ...f, options: (f.options ?? []).join('\n'), required: !!f.required, half: !!f.half, placeholder: f.placeholder ?? '', hint: f.hint ?? '', rows: f.rows ?? '' })),
      }}
    />
  );
}
