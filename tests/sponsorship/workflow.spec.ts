import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { encrypt } from '../../src/lib/sponsorship/encryption';
import { canMove } from '../../src/lib/sponsorship/workflow';

/** Status workflow, sponsors, overview and programme settings. */

const prisma = new PrismaClient();
const password = `test-${Date.now()}-Aa1`;
const coordinator = 'e2e-flow-coordinator@example.test';
const administrator = 'e2e-flow-admin@example.test';
const stamp = Date.now();
const sponsorName = `E2E Sponsor ${stamp}`;
let id = '';
let submissionId = '';
let originalSettings: { programmeName: string; targetChildren: number; retentionMonths: number; recipients: string[]; fieldOverrides: object };

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({ where: { email: coordinator }, create: { email: coordinator, name: 'E2E Flow Coordinator', role: 'SPONSORSHIP_COORDINATOR', passwordHash }, update: { passwordHash } });
  await prisma.user.upsert({ where: { email: administrator }, create: { email: administrator, name: 'E2E Flow Admin', role: 'ADMIN', passwordHash }, update: { passwordHash } });
  const settings = await prisma.sponsorshipSettings.findUniqueOrThrow({ where: { id: 1 } });
  originalSettings = { programmeName: settings.programmeName, targetChildren: settings.targetChildren, retentionMonths: settings.retentionMonths, recipients: settings.recipients, fieldOverrides: settings.fieldOverrides as object };
  const application = await prisma.childApplication.create({
    data: {
      reference: `IACEC-CS-E2E-FLOW-${stamp}`,
      isTest: true,
      child: { create: { fullName: `E2E Flow Child ${stamp}`, gender: 'MALE', dateOfBirth: new Date('2016-01-01'), placeOfBirth: 'Douala', address: 'Test', status: 'LOST_BOTH' } },
      caretaker: { create: { fullName: 'E2E Flow Aunt', relationship: 'Aunt', phones: ['+237 677 000 000'], email: 'flow.caretaker@example.test', address: 'Test', nationalId: encrypt('X') } },
    },
  });
  id = application.id;
  const submission = await prisma.submission.create({ data: { formKey: 'sponsor', data: { full_name: sponsorName, email: 'sponsor@example.test', phone: '+1 555 0100', location: 'Canada', organisation: 'E2E Church' } } });
  submissionId = submission.id;
});

test.afterAll(async () => {
  await prisma.childApplication.deleteMany({ where: { id } });
  await prisma.sponsor.deleteMany({ where: { fullName: sponsorName } });
  await prisma.submission.deleteMany({ where: { id: submissionId } });
  await prisma.sponsorshipSettings.update({ where: { id: 1 }, data: originalSettings });
  await prisma.user.deleteMany({ where: { email: { in: [coordinator, administrator] } } });
  await prisma.$disconnect();
});

async function signIn(page: Page, email: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
}

const profile = (tab = 'notes') => `/admin/sponsorship/applications/${id}?tab=${tab}`;
const status = async () => (await prisma.childApplication.findUniqueOrThrow({ where: { id } })).status;

async function move(page: Page, to: string) {
  await page.goto(profile());
  await page.locator('#status').selectOption(to);
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect.poll(status).toBe(to);
}

test('the workflow rules', () => {
  expect(canMove('NEW', 'CONTACTED', false)).toBe(true);
  expect(canMove('NEW', 'ACCEPTED', false)).toBe(false);
  expect(canMove('NOT_ACCEPTED', 'ACCEPTED', false)).toBe(false);
  expect(canMove('NOT_ACCEPTED', 'ACCEPTED', true)).toBe(true);
});

test('a Coordinator moves a child through the workflow, with every change logged', async ({ page }) => {
  await signIn(page, coordinator);
  await page.goto(profile());
  await expect(page.locator('#status option')).toHaveText(['New', 'Contacted']);

  await move(page, 'CONTACTED');
  await move(page, 'VISIT_SCHEDULED');
  await move(page, 'VERIFIED');

  await page.goto(profile('verification'));
  await page.getByLabel('Decision', { exact: true }).selectOption('ACCEPTED');
  await page.getByRole('button', { name: 'Save verification' }).click();
  await expect.poll(status).toBe('ACCEPTED');

  const changes = await prisma.statusChange.findMany({ where: { applicationId: id }, orderBy: { createdAt: 'asc' } });
  expect(changes.map((c) => c.to)).toEqual(['CONTACTED', 'VISIT_SCHEDULED', 'VERIFIED', 'ACCEPTED']);
  expect(changes.every((c) => c.userName === 'E2E Flow Coordinator')).toBe(true);
});

test('a status change can email the caretaker, and the email is recorded', async ({ page }) => {
  await prisma.childApplication.update({ where: { id }, data: { status: 'VERIFIED' } });
  await signIn(page, coordinator);
  await page.goto(profile());
  await page.locator('#status').selectOption('WAITING_LIST');
  await page.getByLabel('Email the caretaker').check();
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect.poll(status).toBe('WAITING_LIST');
  const last = await prisma.statusChange.findFirstOrThrow({ where: { applicationId: id }, orderBy: { createdAt: 'desc' } });
  expect(last.emailed).toBe(true);
  await prisma.childApplication.update({ where: { id }, data: { status: 'ACCEPTED' } });
});

test('a sponsor form becomes a sponsor in one click, and assigning them sponsors the child', async ({ page }) => {
  await signIn(page, coordinator);
  await page.goto(`/admin/submissions/${submissionId}`);
  await page.getByRole('button', { name: 'Convert to sponsor' }).click();
  await expect(page.getByRole('heading', { name: sponsorName })).toBeVisible();
  const sponsor = await prisma.sponsor.findUniqueOrThrow({ where: { submissionId } });
  expect(sponsor).toMatchObject({ email: 'sponsor@example.test', country: 'Canada', organisation: 'E2E Church' });

  await page.goto(profile('sponsor'));
  await page.getByLabel('Sponsor *').selectOption(sponsor.id);
  await page.getByLabel('Start date *').fill('2026-11-04');
  await page.getByLabel('Fees committed per year (FCFA)').fill('60000');
  await page.getByRole('button', { name: 'Assign sponsor' }).click();
  await expect.poll(status).toBe('SPONSORED');
  await page.reload();
  await expect(page.getByRole('link', { name: sponsorName })).toBeVisible();

  await page.goto('/admin/sponsorship/sponsors');
  const row = page.getByRole('row', { name: new RegExp(sponsorName) });
  await expect(row).toContainText('Active');
  await expect(row).toContainText('60');

  await page.getByRole('link', { name: sponsorName }).click();
  await expect(page.getByRole('link', { name: `E2E Flow Child ${stamp}` })).toBeVisible();
  await page.getByLabel('Term *').fill('Term 1');
  await page.getByLabel('Date sent').fill('2026-11-04');
  await page.getByRole('button', { name: 'Record report' }).click();
  await expect(page.getByText(/Term 1.*sent/)).toBeVisible();
});

test('the overview shows the figures, alerts and backup state', async ({ page }) => {
  await signIn(page, coordinator);
  await page.goto('/admin/sponsorship');
  for (const label of ['Total applications', 'Sponsored children', 'Available places', 'No visit in the last 60 days', 'Applications per month', 'Children by status', 'Children by gender and age group']) {
    await expect(page.getByText(label).first()).toBeVisible();
  }
  await expect(page.getByText(/Google Drive is not connected/)).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: new RegExp(`E2E Flow Child ${stamp}`) }).first()).toBeVisible();
});

test('settings are for Administrators only, and change the public form', async ({ page }) => {
  await signIn(page, coordinator);
  await expect(page.getByRole('link', { name: 'Programme settings' })).toHaveCount(0);
  await page.goto('/admin/sponsorship');
  await expect(page.getByRole('link', { name: 'Programme settings' })).toHaveCount(0);
  await page.goto('/admin/sponsorship/settings');
  await expect(page).toHaveURL(/\/admin\?denied=1/);

  await page.context().clearCookies();
  await signIn(page, administrator);
  await page.goto('/admin/sponsorship/settings');
  await page.getByLabel('Programme name *').fill('E2E Kingdom Heirs');
  await page.getByLabel('Target number of children *').fill('20');
  await page.getByLabel('Notification emails (one per line)').fill('one@example.test\ntwo@example.test');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Saved')).toBeVisible();
  await expect.poll(async () => (await prisma.sponsorshipSettings.findUniqueOrThrow({ where: { id: 1 } })).recipients).toEqual(['one@example.test', 'two@example.test']);

  await page.getByText('Caretaker or guardian').click();
  await page.locator('#o-caretaker_relationship-options').fill('Aunt\nUncle\nGodparent\nOther');
  await page.locator('#o-caretaker_income').fill('Work or income');
  await page.getByRole('button', { name: 'Save wording' }).click();
  await expect.poll(async () => Object.keys((await prisma.sponsorshipSettings.findUniqueOrThrow({ where: { id: 1 } })).fieldOverrides as object).sort()).toEqual(['caretaker_income', 'caretaker_relationship']);

  await page.locator('#o-caretaker_relationship-options').fill('Aunt\nUncle');
  await page.getByRole('button', { name: 'Save wording' }).click();
  await expect(page.getByText(/Please keep “Other”/)).toBeVisible();

  await page.goto('/community-support/register');
  await expect(page.getByText('The E2E Kingdom Heirs supports children')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('iacec-sponsorship-draft', JSON.stringify({ savedAt: Date.now(), step: 3, token: null, values: { x: '1' } })));
  await page.reload();
  await expect(page.locator('#f-caretaker_relationship option', { hasText: 'Godparent' })).toHaveCount(1);
  await expect(page.getByLabel('Work or income')).toBeVisible();
});
