import { NextResponse } from 'next/server';
import { processJobs } from '@/lib/drive/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Optional, for hosts that can run it more often: retries queued Drive uploads between nightly runs. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse(null, { status: 401 });
  return NextResponse.json(await processJobs({ limit: 25 }));
}
