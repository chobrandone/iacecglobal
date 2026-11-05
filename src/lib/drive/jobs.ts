import { prisma } from '@/lib/db';
import { connectDrive, type DriveApi } from './client';
import { syncApplication } from './sync';

const MAX_ATTEMPTS = 8;
const STUCK_MS = 15 * 60_000;

/** Retry delay in minutes: 1, 2, 4, 8 and so on, so a Drive outage is waited out. */
export const backoffMinutes = (attempts: number) => 2 ** (attempts - 1);

/** Marks a child's record as changed and queues it for Drive. A form never waits on this. */
export async function queueSync(applicationId: string) {
  await prisma.childApplication.updateMany({ where: { id: applicationId }, data: { updatedAt: new Date() } });
  const waiting = await prisma.job.findFirst({ where: { type: 'sync-application', status: 'PENDING', payload: { path: ['id'], equals: applicationId } } });
  if (!waiting) await prisma.job.create({ data: { type: 'sync-application', payload: { id: applicationId } } });
}

/** Works through due jobs. With no Drive connected, they simply wait. */
export async function processJobs(options: { drive?: DriveApi | null; limit?: number } = {}) {
  const drive = options.drive === undefined ? await connectDrive().catch(() => null) : options.drive;
  if (!drive) return { done: 0, failed: 0 };

  await prisma.job.updateMany({ where: { status: 'RUNNING', updatedAt: { lt: new Date(Date.now() - STUCK_MS) } }, data: { status: 'PENDING' } });
  const due = await prisma.job.findMany({ where: { status: 'PENDING', runAt: { lte: new Date() } }, orderBy: { runAt: 'asc' }, take: options.limit ?? 10 });

  let done = 0;
  let failed = 0;
  for (const job of due) {
    const claimed = await prisma.job.updateMany({ where: { id: job.id, status: 'PENDING' }, data: { status: 'RUNNING' } });
    if (!claimed.count) continue;
    const run = await prisma.backupRun.create({ data: { type: 'REALTIME' } });
    try {
      const payload = job.payload as { id: string; folderId?: string };
      const sent = job.type === 'delete-folder' ? (await drive.remove(payload.folderId!), { files: 0, bytes: 0 }) : await syncApplication(drive, payload.id);
      await prisma.job.update({ where: { id: job.id }, data: { status: 'DONE', lastError: null } });
      await prisma.backupRun.update({ where: { id: run.id }, data: { status: 'SUCCESS', finishedAt: new Date(), filesUploaded: sent.files, bytes: sent.bytes } });
      done += 1;
    } catch (e) {
      const error = (e instanceof Error ? e.message : 'Unknown error').slice(0, 500);
      const attempts = job.attempts + 1;
      await prisma.job.update({
        where: { id: job.id },
        data: { attempts, lastError: error, status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING', runAt: new Date(Date.now() + backoffMinutes(attempts) * 60_000) },
      });
      await prisma.backupRun.update({ where: { id: run.id }, data: { status: 'FAILED', finishedAt: new Date(), error } });
      failed += 1;
    }
  }
  return { done, failed };
}
