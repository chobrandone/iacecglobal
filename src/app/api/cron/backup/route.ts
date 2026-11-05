import { NextResponse } from 'next/server';
import { isFirstOfMonth, runBackup } from '@/lib/drive/backup';
import { connectDrive } from '@/lib/drive/client';
import { processJobs } from '@/lib/drive/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Nightly at 02:00 Douala time. Vercel Cron and external schedulers send the secret as a Bearer token. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse(null, { status: 401 });

  const drive = await connectDrive().catch(() => null);
  if (!drive) return NextResponse.json({ skipped: 'Google Drive is not connected.' });

  await processJobs({ drive });
  const daily = await runBackup(drive, 'DAILY');
  const monthly = isFirstOfMonth() ? await runBackup(drive, 'MONTHLY') : null;
  return NextResponse.json({ daily, monthly });
}
