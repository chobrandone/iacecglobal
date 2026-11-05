import { BlobReader, BlobWriter, ZipWriter, configure } from '@zip.js/zip.js';
import type { BackupType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/email';
import type { DriveApi } from './client';
import { dumpTables, dumpWorkbook, packDump } from './dump';
import { rootFolder, syncOutstanding } from './sync';

configure({ useWebWorkers: false });

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const LOG_NAME = 'Backup Log.csv';
const RUN_MS = 240_000; // stay inside the host's function time limit

function douala(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { month: `${parts.year}-${parts.month}`, day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}${parts.minute}`, date: Number(parts.day) };
}

export const isFirstOfMonth = (now = new Date()) => douala(now).date === 1;

async function encrypted(files: { name: string; body: Buffer }[], password: string) {
  const zip = new ZipWriter(new BlobWriter('application/zip'), { password, encryptionStrength: 3 });
  for (const f of files) await zip.add(f.name, new BlobReader(new Blob([new Uint8Array(f.body)])));
  return Buffer.from(await (await zip.close()).arrayBuffer());
}

/** Keeps the newest daily backups and any monthly ones inside the retention period. */
export async function applyRetention(drive: DriveApi, dailyId: string, monthlyId: string, keepDaily: number, retentionMonths: number, now = new Date()) {
  const daily = await drive.list(dailyId);
  const stamps = [...new Set(daily.map((f) => f.name.slice(0, 15)))].sort().reverse();
  const keep = new Set(stamps.slice(0, keepDaily));
  for (const f of daily) if (!keep.has(f.name.slice(0, 15))) await drive.remove(f.id);

  const oldest = new Date(now);
  oldest.setUTCMonth(oldest.getUTCMonth() - retentionMonths);
  const cutoff = oldest.toISOString().slice(0, 7);
  for (const f of await drive.list(monthlyId)) if (f.name.slice(0, 7) < cutoff) await drive.remove(f.id);
}

async function appendLog(drive: DriveApi, root: string, line: string) {
  const existing = (await drive.list(root)).find((f) => f.name === LOG_NAME);
  const before = existing ? (await drive.download(existing.id)).toString('utf8') : 'Time,Type,Status,Files,Bytes,Error\n';
  await drive.upload({ name: LOG_NAME, parentId: root, mimeType: 'text/csv', body: Buffer.from(`${before}${line}\n`), replaceId: existing?.id });
}

async function alertIfRepeated(notify: (to: string[]) => Promise<unknown>) {
  const last = await prisma.backupRun.findMany({ orderBy: { startedAt: 'desc' }, take: 3, select: { status: true } });
  // Exactly the second failure in a row, so one problem sends one email.
  if (last[0]?.status !== 'FAILED' || last[1]?.status !== 'FAILED' || last[2]?.status === 'FAILED') return;
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', active: true }, select: { email: true } });
  await notify(admins.map((a) => a.email));
}

const emailAdmins = (to: string[]) =>
  sendMail({ to, subject: 'IACEC backup failed twice', text: 'The Google Drive backup has failed twice in a row. Sign in and open Sponsorship, then Backups, to see the error and test the connection.' });

/** A full backup: outstanding files, then the database as Excel and JSON. Every run is recorded. */
export async function runBackup(drive: DriveApi, type: BackupType, options: { now?: Date; notify?: (to: string[]) => Promise<unknown> } = {}) {
  const now = options.now ?? new Date();
  const run = await prisma.backupRun.create({ data: { type } });
  let filesUploaded = 0;
  let bytes = 0;
  try {
    const settings = await prisma.sponsorshipSettings.findUniqueOrThrow({ where: { id: 1 } });
    const password = process.env.BACKUP_ENCRYPTION_PASSWORD;
    if (settings.encryptBackups && !password) throw new Error('Backup encryption is on but BACKUP_ENCRYPTION_PASSWORD is not set. Nothing was uploaded.');

    const synced = await syncOutstanding(drive, now.getTime() + RUN_MS);
    filesUploaded += synced.files;
    bytes += synced.bytes;

    const root = await rootFolder(drive);
    const backups = await drive.ensureFolder('Database Backups', root);
    const [dailyId, monthlyId] = await Promise.all([drive.ensureFolder('Daily', backups), drive.ensureFolder('Monthly', backups)]);

    const dump = await dumpTables();
    const workbook = await dumpWorkbook(dump, settings.encryptBackups);
    const packed = packDump(dump);
    const t = douala(now);
    const stem = type === 'MONTHLY' ? `${t.month}_iacec-sponsorship` : `${t.day}_${t.time}_iacec-sponsorship`;
    const parentId = type === 'MONTHLY' ? monthlyId : dailyId;
    const upload = async (name: string, mimeType: string, body: Buffer) => {
      await drive.upload({ name, parentId, mimeType, body });
      filesUploaded += 1;
      bytes += body.length;
    };
    if (settings.encryptBackups) {
      await upload(`${stem}.zip`, 'application/zip', await encrypted([{ name: `${stem}.xlsx`, body: workbook }, { name: `${stem}.json.gz`, body: packed }], password!));
    } else {
      await upload(`${stem}.xlsx`, XLSX, workbook);
      await upload(`${stem}.json.gz`, 'application/gzip', packed);
    }

    await applyRetention(drive, dailyId, monthlyId, settings.keepDailyBackups, settings.retentionMonths, now);
    if (synced.failed) throw new Error(`The database was backed up, but ${synced.failed} ${synced.failed === 1 ? 'child’s files' : 'children’s files'} could not be copied.`);
    await prisma.backupRun.update({ where: { id: run.id }, data: { status: 'SUCCESS', finishedAt: new Date(), filesUploaded, bytes } });
    await appendLog(drive, root, `${now.toISOString()},${type},SUCCESS,${filesUploaded},${bytes},`).catch(() => undefined);
    return { ok: true as const, filesUploaded, bytes };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    await prisma.backupRun.update({ where: { id: run.id }, data: { status: 'FAILED', finishedAt: new Date(), filesUploaded, bytes, error: error.slice(0, 500) } });
    await alertIfRepeated(options.notify ?? emailAdmins);
    return { ok: false as const, error };
  }
}

/** Proves the connection by creating and deleting a small file. */
export async function testConnection(drive: DriveApi) {
  const root = await rootFolder(drive);
  const id = await drive.upload({ name: 'IACEC connection test.txt', parentId: root, mimeType: 'text/plain', body: Buffer.from('Connection test. Safe to delete.') });
  await drive.remove(id);
}
