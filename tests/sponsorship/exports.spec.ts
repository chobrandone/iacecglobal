import { writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { encrypt } from '../../src/lib/sponsorship/encryption';
import { sponsorReportRows } from '../../src/lib/sponsorship/pdf/reports';

/** Paper form, PDFs and exports. */

const prisma = new PrismaClient();
const password = `test-${Date.now()}-Aa1`;
const coordinator = 'e2e-export-coordinator@example.test';
const editor = 'e2e-export-editor@example.test';
const stamp = Date.now();
const childName = `E2E Export Ñgono ${stamp}`;
let id = '';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({ where: { email: coordinator }, create: { email: coordinator, name: 'E2E Export Coordinator', role: 'SPONSORSHIP_COORDINATOR', passwordHash }, update: { passwordHash } });
  await prisma.user.upsert({ where: { email: editor }, create: { email: editor, name: 'E2E Export Editor', role: 'EDITOR', passwordHash }, update: { passwordHash } });
  const application = await prisma.childApplication.create({
    data: {
      reference: `IACEC-CS-E2E-EXPORT-${stamp}`,
      isTest: true,
      declarations: { truthful: true, visits: true, inform: true, activities: true },
      child: { create: { fullName: childName, gender: 'FEMALE', dateOfBirth: new Date('2014-03-03'), placeOfBirth: 'Kribi', address: 'Secret quarter', status: 'LOST_MOTHER', healthNotes: encrypt('Secret health note') } },
      parents: { create: [{ role: 'FATHER', deceased: false }, { role: 'MOTHER', deceased: true, fullName: 'Ŋgono → Mother' }] },
      caretaker: { create: { fullName: 'E2E Export Aunt', relationship: 'Aunt', phones: ['+237 677 000 000'], address: 'Secret quarter', nationalId: encrypt('SECRET-ID-555') } },
      schoolRecords: { create: { schoolYear: '2026/2027', school: 'E2E Export School', level: 'Class 6', feesDue: 40000 } },
    },
  });
  id = application.id;
});

test.afterAll(async () => {
  await prisma.childApplication.deleteMany({ where: { id } });
  await prisma.user.deleteMany({ where: { email: { in: [coordinator, editor] } } });
  await prisma.$disconnect();
});

async function signIn(page: Page, email: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
}

test('the paper form is public, valid and linked from the wizard', async ({ page, request }) => {
  const res = await request.get('/community-support/register/paper-form.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/pdf');
  const body = await res.body();
  writeFileSync('test-results/paper-form.pdf', body);
  expect((await PDFDocument.load(body)).getPageCount()).toBeGreaterThan(3);

  await page.goto('/community-support/register');
  await expect(page.getByRole('link', { name: 'Download paper form (PDF)' })).toHaveAttribute('href', '/community-support/register/paper-form.pdf');
});

test('a sponsor report leaves out everything sensitive', () => {
  const text = JSON.stringify(
    sponsorReportRows({ fullName: 'Amara Secretsurname', dateOfBirth: new Date('2014-01-01'), level: 'Class 6', results: '14/20', feesDue: 40000, feesPaid: 10000, visitCount: 2, lastVisit: new Date('2026-10-01'), materialItems: ['Uniform'] }),
  );
  expect(text).toContain('Amara');
  expect(text).not.toContain('Secretsurname');
  expect(JSON.parse(text)).toHaveLength(7);
});

test('Editors and signed-out visitors get no PDFs or exports', async ({ page, request }) => {
  for (const path of [`/api/sponsorship/pdf/${id}`, `/api/sponsorship/pdf/${id}?type=report`, '/api/sponsorship/export']) {
    expect((await request.get(path)).status()).toBe(401);
  }
  await signIn(page, editor);
  for (const path of [`/api/sponsorship/pdf/${id}`, '/api/sponsorship/export']) {
    expect((await page.request.get(path)).status()).toBe(403);
  }
});

test.describe('as a Coordinator', () => {
  test.beforeEach(({ page }) => signIn(page, coordinator));

  test('profile and sponsor report PDFs download, even with unusual letters, and are audited', async ({ page }) => {
    await page.goto(`/admin/sponsorship/applications/${id}?tab=print`);
    await expect(page.getByRole('button', { name: 'Download profile PDF' })).toBeVisible();

    for (const [query, type, name] of [['', 'profile', 'profile'], ['?type=report', 'sponsor-report', 'report']] as const) {
      const res = await page.request.get(`/api/sponsorship/pdf/${id}${query}`);
      expect(res.status()).toBe(200);
      const body = await res.body();
      writeFileSync(`test-results/${name}.pdf`, body);
      await PDFDocument.load(body);
      const logged = await prisma.auditLog.findMany({ where: { action: 'download', entity: 'application-pdf', entityId: id, userName: 'E2E Export Coordinator' } });
      expect(logged.some((l) => (l.detail as { type: string }).type === type)).toBe(true);
    }
  });

  test('Excel leaves out sensitive fields unless they are chosen', async ({ page }) => {
    const load = async (extra: string) => {
      const res = await page.request.get(`/api/sponsorship/export?ids=${id}&format=xlsx${extra}`);
      expect(res.status()).toBe(200);
      const book = new ExcelJS.Workbook();
      await book.xlsx.load((await res.body()) as unknown as ArrayBuffer);
      const sheet = book.getWorksheet('Applications')!;
      return { headers: sheet.getRow(1).values as unknown[], text: JSON.stringify(sheet.getRow(2).values), rows: sheet.rowCount };
    };
    const plain = await load('');
    expect(plain.rows).toBe(2);
    expect(plain.text).toContain(childName);
    expect(plain.headers).not.toContain('National ID');
    expect(plain.text).not.toContain('SECRET-ID-555');
    expect(plain.text).not.toContain('Secret health note');

    const full = await load('&sensitive=1');
    expect(full.headers).toContain('National ID');
    expect(full.text).toContain('SECRET-ID-555');
    expect(full.text).toContain('Secret health note');

    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: 'export', userName: 'E2E Export Coordinator' }, orderBy: { createdAt: 'desc' } });
    expect(log.detail).toMatchObject({ format: 'xlsx', sensitive: true, count: 1 });
  });

  test('CSV follows the filters on the list', async ({ page }) => {
    const hit = await (await page.request.get(`/api/sponsorship/export?format=csv&q=${encodeURIComponent(childName)}`)).text();
    expect(hit).toContain('E2E Export School');
    expect(hit).not.toContain('SECRET-ID-555');
    const miss = await (await page.request.get(`/api/sponsorship/export?format=csv&q=${encodeURIComponent(childName)}&gender=MALE`)).text();
    expect(miss).not.toContain('E2E Export School');
  });

  test('the export window downloads the file', async ({ page }) => {
    await page.goto(`/admin/sponsorship/applications?q=${encodeURIComponent(childName)}`);
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.locator('#export-format').selectOption('csv');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  });
});
