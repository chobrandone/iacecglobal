import { NextResponse } from 'next/server';
import { csvResponse, toCsv } from '@/lib/csv';
import { can, currentUser } from '@/lib/permissions';
import { audit } from '@/lib/sponsorship/audit';
import { exportRows, toWorkbook } from '@/lib/sponsorship/export';
import { applicationWhere } from '@/lib/sponsorship/filters';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!can(user.role, 'sponsorship')) return new NextResponse(null, { status: 403 });

  const params = new URL(req.url).searchParams;
  const ids = params.get('ids')?.split(',').filter(Boolean);
  const sensitive = params.get('sensitive') === '1';
  const format = params.get('format') === 'csv' ? 'csv' : 'xlsx';
  const where = ids?.length ? { id: { in: ids } } : applicationWhere(Object.fromEntries(params));

  const { headers, rows } = await exportRows(where, sensitive);
  await audit(user, 'export', 'applications', undefined, { format, sensitive, count: rows.length, selection: !!ids?.length });

  const filename = `iacec-sponsorship-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') return csvResponse(`${filename}.csv`, toCsv(headers, rows));
  return new Response(new Uint8Array(await toWorkbook([{ name: 'Applications', headers, rows }])), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
