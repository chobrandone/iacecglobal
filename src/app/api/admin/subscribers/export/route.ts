import { NextResponse } from 'next/server';
import { csvResponse, toCsv } from '@/lib/csv';
import { prisma } from '@/lib/db';
import { requireCapability } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireCapability('subscribers');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  const csv = toCsv(
    ['Email', 'Source', 'Subscribed'],
    subs.map((s) => [s.email, s.source, s.createdAt.toISOString()]),
  );
  return csvResponse(`newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
