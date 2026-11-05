import { prisma } from '@/lib/db';
import { withOverrides, type FieldOverrides } from '@/lib/sponsorship/fields';
import { paperForm } from '@/lib/sponsorship/pdf/paper-form';
import { pdfResponse } from '@/lib/sponsorship/pdf/sheet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The blank form for caretakers who prefer paper. It contains no child data. */
export async function GET() {
  const settings = await prisma.sponsorshipSettings.findUnique({ where: { id: 1 } });
  const bytes = await paperForm(withOverrides((settings?.fieldOverrides ?? {}) as FieldOverrides), settings?.programmeName ?? 'Child Sponsorship Programme');
  return pdfResponse(bytes, 'iacec-child-sponsorship-form.pdf');
}
