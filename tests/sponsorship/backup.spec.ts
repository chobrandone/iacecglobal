import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BlobReader, BlobWriter, TextWriter, ZipReader, configure, type FileEntry } from '@zip.js/zip.js';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { applyRetention, isFirstOfMonth, runBackup, testConnection } from '../../src/lib/drive/backup';
import type { DriveApi } from '../../src/lib/drive/client';
import { dumpTables, dumpWorkbook, packDump, unpackDump } from '../../src/lib/drive/dump';
import { backoffMinutes, processJobs, queueSync } from '../../src/lib/drive/jobs';
import { restoreDump } from '../../src/lib/drive/restore';
import { deleteApplicationFolder, syncApplication } from '../../src/lib/drive/sync';
import { decrypt, encrypt } from '../../src/lib/sponsorship/encryption';

/** Backups against an in-memory Drive. Nothing here talks to Google. */

configure({ useWebWorkers: false });
const prisma = new PrismaClient();
const stamp = Date.now();
const childName = `E2E Backup Child ${stamp}`;
const reference = `IACEC-CS-E2E-BACKUP-${stamp}`;
const storageKey = `e2e-backup/${stamp}.pdf`;
let id = '';
let documentId = '';
let original: { driveFolderId: string | null; encryptBackups: boolean; keepDailyBackups: number };

type Item = { id: string; name: string; parentId: string | null; body?: Buffer; folder: boolean };

function memoryDrive(failing = { on: false }) {
  const items = new Map<string, Item>();
  let n = 0;
  const check = () => {
    if (failing.on) throw new Error('Drive is down');
  };
  const api: DriveApi = {
    async ensureFolder(name, parentId) {
      check();
      const found = [...items.values()].find((i) => i.folder && i.name === name && i.parentId === parentId);
      if (found) return found.id;
      const item = { id: `id${(n += 1)}`, name, parentId, folder: true };
      items.set(item.id, item);
      return item.id;
    },
    async rename(fileId, name) {
      check();
      items.get(fileId)!.name = name;
    },
    async upload({ name, parentId, body, replaceId }) {
      check();
      if (replaceId) {
        Object.assign(items.get(replaceId)!, { name, body });
        return replaceId;
      }
      const item = { id: `id${(n += 1)}`, name, parentId, body, folder: false };
      items.set(item.id, item);
      return item.id;
    },
    async list(parentId) {
      check();
      return [...items.values()].filter((i) => i.parentId === parentId).map(({ id: fileId, name }) => ({ id: fileId, name }));
    },
    async download(fileId) {
      check();
      return items.get(fileId)!.body!;
    },
    async remove(fileId) {
      check();
      const gone = [fileId];
      while (gone.length) {
        const next = gone.pop()!;
        items.delete(next);
        for (const i of items.values()) if (i.parentId === next) gone.push(i.id);
      }
    },
  };
  const pathOf = (i: Item): string => (i.parentId && items.get(i.parentId) ? `${pathOf(items.get(i.parentId)!)}/${i.name}` : i.name);
  return { api, paths: () => [...items.values()].map(pathOf).sort(), find: (name: string) => [...items.values()].find((i) => i.name.includes(name)) };
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const settings = await prisma.sponsorshipSettings.findUniqueOrThrow({ where: { id: 1 } });
  original = { driveFolderId: settings.driveFolderId, encryptBackups: settings.encryptBackups, keepDailyBackups: settings.keepDailyBackups };
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: null, encryptBackups: true } });
  mkdirSync(path.join('.private-uploads', 'e2e-backup'), { recursive: true });
  writeFileSync(path.join('.private-uploads', storageKey), '%PDF-1.4\n% test\n');
  const application = await prisma.childApplication.create({
    data: {
      reference,
      isTest: true,
      declarations: {},
      child: { create: { fullName: childName, gender: 'MALE', dateOfBirth: new Date('2015-05-05'), placeOfBirth: 'Limbe', address: 'Test', status: 'LOST_BOTH', healthNotes: encrypt('Backup health note') } },
      caretaker: { create: { fullName: 'E2E Backup Aunt', relationship: 'Aunt', phones: ['+237 677 000 000'], address: 'Test', nationalId: encrypt('BACKUP-ID-1') } },
      documents: { create: { type: 'BIRTH_CERTIFICATE', storageKey, filename: 'birth.pdf', mimeType: 'application/pdf', size: 16 } },
    },
    include: { documents: true },
  });
  id = application.id;
  documentId = application.documents[0].id;
  await prisma.driveSync.deleteMany();
});

// Each test gets a fresh in-memory Drive, so nothing may remember the last one.
test.beforeEach(async () => {
  await prisma.driveSync.deleteMany();
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: null } });
});

test.afterAll(async () => {
  await prisma.childApplication.deleteMany({ where: { id } });
  await prisma.deletionTombstone.deleteMany({ where: { reference } });
  await prisma.driveSync.deleteMany();
  await prisma.job.deleteMany({ where: { payload: { path: ['id'], equals: id } } });
  await prisma.backupRun.deleteMany();
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: original });
  await prisma.$disconnect();
});

test('the test connection button creates and deletes a file', async () => {
  const drive = memoryDrive();
  await testConnection(drive.api);
  expect(drive.find('connection test')).toBeUndefined();
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: null } });
});

test('a child syncs into the agreed folder structure, and unchanged files are not sent twice', async () => {
  const drive = memoryDrive();
  await prisma.visitLog.create({ data: { childId: (await prisma.child.findFirstOrThrow({ where: { applicationId: id } })).id, date: new Date('2026-11-01'), byName: 'E2E', type: 'HOME' } });
  const first = await syncApplication(drive.api, id);
  const base = `IACEC Child Sponsorship/Applications/${reference} - ${childName}`;
  expect(drive.paths()).toEqual(expect.arrayContaining([`${base}/Application.pdf`, `${base}/Documents/birth_certificate - birth.pdf`, `${base}/Visits/Visit log.pdf`, `${base}/Fees`]));
  expect(first.files).toBe(3);
  expect((await syncApplication(drive.api, id)).files).toBe(0);

  await prisma.child.update({ where: { applicationId: id }, data: { fullName: `${childName} Renamed` } });
  await prisma.childApplication.update({ where: { id }, data: { updatedAt: new Date() } });
  await syncApplication(drive.api, id);
  expect(drive.paths().some((p) => p.includes(`${childName} Renamed/Application.pdf`))).toBe(true);
  expect(drive.paths().filter((p) => p.endsWith('Application.pdf'))).toHaveLength(1);
  await prisma.child.update({ where: { applicationId: id }, data: { fullName: childName } });
  await prisma.driveSync.deleteMany();
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: null } });
});

test('a Drive outage waits and retries with growing delays', async () => {
  expect([1, 2, 3, 4].map(backoffMinutes)).toEqual([1, 2, 4, 8]);
  const failing = { on: true };
  const drive = memoryDrive(failing);
  await prisma.job.deleteMany();

  await queueSync(id);
  await queueSync(id);
  expect(await prisma.job.count({ where: { payload: { path: ['id'], equals: id } } })).toBe(1);

  expect(await processJobs({ drive: drive.api })).toMatchObject({ done: 0, failed: 1 });
  const job = await prisma.job.findFirstOrThrow({ where: { payload: { path: ['id'], equals: id } } });
  expect(job).toMatchObject({ status: 'PENDING', attempts: 1, lastError: 'Drive is down' });
  expect(job.runAt.getTime()).toBeGreaterThan(Date.now());

  failing.on = false;
  await prisma.job.update({ where: { id: job.id }, data: { runAt: new Date() } });
  expect(await processJobs({ drive: drive.api })).toMatchObject({ done: 1, failed: 0 });
  await prisma.driveSync.deleteMany();
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: { driveFolderId: null } });
});

test('with no Drive connected, jobs simply wait', async () => {
  await queueSync(id);
  expect(await processJobs({ drive: null })).toEqual({ done: 0, failed: 0 });
  await prisma.job.deleteMany({ where: { payload: { path: ['id'], equals: id } } });
});

test('a nightly backup is encrypted, and only opens with the password', async () => {
  const drive = memoryDrive();
  const result = await runBackup(drive.api, 'DAILY', { now: new Date('2026-11-04T01:00:00Z') });
  expect(result).toMatchObject({ ok: true });
  expect(drive.paths()).toContain('IACEC Child Sponsorship/Database Backups/Daily/2026-11-04_0200_iacec-sponsorship.zip');
  expect(drive.paths()).toContain('IACEC Child Sponsorship/Backup Log.csv');
  expect(drive.paths().some((p) => p.endsWith('.json.gz') || p.endsWith('.xlsx'))).toBe(false);
  expect((await drive.api.download(drive.find('Backup Log')!.id)).toString()).toContain('DAILY,SUCCESS');

  const blob = new Blob([new Uint8Array(drive.find('.zip')!.body!)]);
  await expect(new ZipReader(new BlobReader(blob)).getEntries().then((e) => (e[0] as FileEntry).getData(new TextWriter()))).rejects.toThrow();

  const entries = await new ZipReader(new BlobReader(blob), { password: process.env.BACKUP_ENCRYPTION_PASSWORD }).getEntries();
  expect(entries.map((e) => e.filename).sort()).toEqual(['2026-11-04_0200_iacec-sponsorship.json.gz', '2026-11-04_0200_iacec-sponsorship.xlsx']);
  const gz = await (entries.find((e) => e.filename.endsWith('.gz')) as FileEntry).getData(new BlobWriter());
  const dump = unpackDump(Buffer.from(await gz.arrayBuffer()));
  expect(dump.tables.childApplication.some((a) => a.reference === reference)).toBe(true);
  expect(JSON.stringify(dump)).not.toContain('BACKUP-ID-1');
  expect(dump.tables.sponsorshipSettings[0].googleRefreshToken).toBeNull();
  expect(await prisma.backupRun.count({ where: { type: 'DAILY', status: 'SUCCESS' } })).toBeGreaterThan(0);
});

test('without encryption, sensitive columns are left out of Excel', async () => {
  const dump = await dumpTables();
  const book = new ExcelJS.Workbook();
  await book.xlsx.load((await dumpWorkbook(dump, false)) as unknown as ArrayBuffer);
  expect(book.worksheets.map((s) => s.name)).toEqual(['Applications', 'Children', 'Caretakers', 'Family references', 'Care team', 'Sponsors', 'Visits', 'Fees', 'Material support', 'Status history']);
  const caretakers = book.getWorksheet('Caretakers')!;
  expect(caretakers.getRow(1).values).not.toContain('nationalId');
  expect(JSON.stringify(caretakers.getSheetValues())).not.toContain('BACKUP-ID-1');

  const full = new ExcelJS.Workbook();
  await full.xlsx.load((await dumpWorkbook(dump, true)) as unknown as ArrayBuffer);
  expect(JSON.stringify(full.getWorksheet('Caretakers')!.getSheetValues())).toContain('BACKUP-ID-1');
});

test('with encryption on and no password, nothing is uploaded', async () => {
  const drive = memoryDrive();
  const saved = process.env.BACKUP_ENCRYPTION_PASSWORD;
  delete process.env.BACKUP_ENCRYPTION_PASSWORD;
  const result = await runBackup(drive.api, 'DAILY');
  process.env.BACKUP_ENCRYPTION_PASSWORD = saved;
  expect(result.ok).toBe(false);
  expect(drive.paths()).toEqual([]);
});

test('monthly snapshots go in their own folder, on the 1st in Douala time', async () => {
  expect(isFirstOfMonth(new Date('2026-11-30T23:30:00Z'))).toBe(true);
  expect(isFirstOfMonth(new Date('2026-11-30T22:30:00Z'))).toBe(false);
  const drive = memoryDrive();
  await runBackup(drive.api, 'MONTHLY', { now: new Date('2026-11-01T01:00:00Z') });
  expect(drive.paths()).toContain('IACEC Child Sponsorship/Database Backups/Monthly/2026-11_iacec-sponsorship.zip');
  await prisma.driveSync.deleteMany();
});

test('old daily and expired monthly backups are removed', async () => {
  const drive = memoryDrive();
  const daily = await drive.api.ensureFolder('Daily', null);
  const monthly = await drive.api.ensureFolder('Monthly', null);
  for (const day of ['01', '02', '03', '04']) {
    await drive.api.upload({ name: `2026-11-${day}_0200_iacec-sponsorship.zip`, parentId: daily, mimeType: 'x', body: Buffer.from('x') });
  }
  await drive.api.upload({ name: '2019-01_iacec-sponsorship.zip', parentId: monthly, mimeType: 'x', body: Buffer.from('x') });
  await drive.api.upload({ name: '2026-10_iacec-sponsorship.zip', parentId: monthly, mimeType: 'x', body: Buffer.from('x') });
  await applyRetention(drive.api, daily, monthly, 2, 84, new Date('2026-11-04T01:00:00Z'));
  expect((await drive.api.list(daily)).map((f) => f.name.slice(8, 10)).sort()).toEqual(['03', '04']);
  expect((await drive.api.list(monthly)).map((f) => f.name)).toEqual(['2026-10_iacec-sponsorship.zip']);
});

test('one email goes out on the second failure in a row, not on every failure', async () => {
  await prisma.backupRun.deleteMany();
  const failing = memoryDrive({ on: true });
  const sent: string[][] = [];
  const notify = async (to: string[]) => void sent.push(to);
  await runBackup(failing.api, 'DAILY', { notify });
  expect(sent).toHaveLength(0);
  await runBackup(failing.api, 'DAILY', { notify });
  expect(sent).toHaveLength(1);
  await runBackup(failing.api, 'DAILY', { notify });
  expect(sent).toHaveLength(1);
  expect((await prisma.backupRun.findFirstOrThrow({ orderBy: { startedAt: 'desc' } })).error).toBe('Drive is down');
});

test('a backup restores into an empty database, and deleted children stay deleted', async () => {
  const name = `iacec_restore_${randomBytes(4).toString('hex')}`;
  const url = new URL(process.env.DATABASE_URL!);
  await prisma.$executeRawUnsafe(`CREATE DATABASE "${name}" ENCODING 'UTF8' TEMPLATE template0`);
  url.pathname = `/${name}`;
  const target = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' });
    const dump = unpackDump(packDump(await dumpTables()));
    const secondChild = structuredClone(dump.tables.childApplication.find((a) => a.reference === reference)!);

    const counts = await restoreDump(target, dump);
    expect(counts.childApplication).toBe(dump.tables.childApplication.length);
    const restored = await target.childApplication.findUniqueOrThrow({ where: { reference }, include: { caretaker: true, documents: true } });
    expect(decrypt(restored.caretaker!.nationalId)).toBe('BACKUP-ID-1');
    expect(restored.documents).toHaveLength(1);

    await expect(restoreDump(target, dump)).rejects.toThrow(/empty database/);

    await target.childApplication.deleteMany();
    await target.sponsor.deleteMany();
    for (const table of ['AuditLog', 'ReferenceCounter', 'DeletionTombstone']) await target.$executeRawUnsafe(`DELETE FROM "${table}"`);
    await restoreDump(target, dump, [secondChild.reference as string]);
    expect(await target.childApplication.count({ where: { reference } })).toBe(0);
    expect(await target.child.count({ where: { fullName: childName } })).toBe(0);
  } finally {
    await target.$disconnect();
    await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  }
});

test('deleting a child removes their Drive folder', async () => {
  const drive = memoryDrive();
  await syncApplication(drive.api, id);
  expect(drive.paths().some((p) => p.includes(reference))).toBe(true);
  await deleteApplicationFolder(drive.api, id, [documentId]);
  expect(drive.paths().some((p) => p.includes(reference))).toBe(false);
  expect(await prisma.driveSync.count({ where: { entityId: id } })).toBe(0);
});

test.describe('in the admin', () => {
  const password = `test-${stamp}-Aa1`;
  const admin = 'e2e-backup-admin@example.test';
  const coordinator = 'e2e-backup-coordinator@example.test';
  const victim = `IACEC-CS-E2E-DELETE-${stamp}`;

  test.beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({ where: { email: admin }, create: { email: admin, name: 'E2E Backup Admin', role: 'ADMIN', passwordHash }, update: { passwordHash } });
    await prisma.user.upsert({ where: { email: coordinator }, create: { email: coordinator, name: 'E2E Backup Coordinator', role: 'SPONSORSHIP_COORDINATOR', passwordHash }, update: { passwordHash } });
    await prisma.childApplication.create({
      data: { reference: victim, isTest: true, child: { create: { fullName: 'E2E Delete Child', gender: 'MALE', dateOfBirth: new Date('2015-05-05'), placeOfBirth: 'Limbe', address: 'Test', status: 'LOST_BOTH' } } },
    });
  });

  test.afterAll(async () => {
    await prisma.childApplication.deleteMany({ where: { reference: victim } });
    await prisma.deletionTombstone.deleteMany({ where: { reference: victim } });
    await prisma.user.deleteMany({ where: { email: { in: [admin, coordinator] } } });
  });

  async function signIn(page: Page, email: string) {
    await page.goto('/admin/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
  }

  test('scheduled routes refuse anyone without the secret', async ({ request }) => {
    expect((await request.get('/api/cron/backup')).status()).toBe(401);
    expect((await request.get('/api/cron/jobs', { headers: { authorization: 'Bearer wrong' } })).status()).toBe(401);
    const ok = await request.get('/api/cron/backup', { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toEqual({ skipped: 'Google Drive is not connected.' });
  });

  test('a Coordinator cannot reach backup settings, the Google connection or permanent delete', async ({ page }) => {
    await signIn(page, coordinator);
    await page.goto('/admin/sponsorship/backups');
    await expect(page).toHaveURL(/\/admin\?denied=1/);
    expect((await page.request.get('/api/google/oauth', { maxRedirects: 0 })).status()).toBe(403);
    const row = await prisma.childApplication.findUniqueOrThrow({ where: { reference: victim } });
    await page.goto(`/admin/sponsorship/applications/${row.id}?tab=print`);
    await expect(page.getByText('Delete this record permanently')).toHaveCount(0);
  });

  test('an Administrator sees the Connect button, and deletion needs the reference typed', async ({ page }) => {
    await signIn(page, admin);
    await page.goto('/admin/sponsorship/backups');
    await expect(page.getByRole('button', { name: 'Connect Google Drive' })).toBeVisible();
    await expect(page.getByText('Not connected')).toBeVisible();

    const row = await prisma.childApplication.findUniqueOrThrow({ where: { reference: victim } });
    await page.goto(`/admin/sponsorship/applications/${row.id}?tab=print`);
    const button = page.getByRole('button', { name: 'Delete permanently' });
    await expect(button).toBeDisabled();
    await page.getByLabel(`Type ${victim} to confirm`).fill(victim);
    await button.click();
    await expect(page).toHaveURL(/\/admin\/sponsorship\/applications$/);
    expect(await prisma.childApplication.count({ where: { reference: victim } })).toBe(0);
    expect(await prisma.deletionTombstone.count({ where: { reference: victim } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: 'delete', entityId: row.id, userName: 'E2E Backup Admin' } })).toBe(1);
  });
});
