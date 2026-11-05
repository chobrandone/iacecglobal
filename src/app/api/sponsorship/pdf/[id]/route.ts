import { NextResponse } from 'next/server';
import { can, currentUser } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { profilePdf, sponsorReportPdf } from '@/lib/sponsorship/pdf/reports';
import { pdfResponse } from '@/lib/sponsorship/pdf/sheet';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!can(user.role, 'sponsorship')) return new NextResponse(null, { status: 403 });

  const { id } = await params;
  const report = new URL(req.url).searchParams.get('type') === 'report';
  const pdf = report ? await sponsorReportPdf(id) : await profilePdf(id);
  if (!pdf) return new NextResponse(null, { status: 404 });
  await audit(user, 'download', 'application-pdf', id, { type: report ? 'sponsor-report' : 'profile' });
  return pdfResponse(pdf.bytes, pdf.filename);
}
