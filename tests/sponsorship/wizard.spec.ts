import { existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';

/** The public registration form, on a phone-sized screen. */

test.use({ viewport: { width: 390, height: 844 } });

const prisma = new PrismaClient();
const jpeg = { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2000, 1)]) };
const pdf = { name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test file\n') };
const fake = { name: 'not-a-photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is plain text, not an image') };
const childName = `E2E Wizard Child ${Date.now()}`;

test.afterAll(async () => {
  await prisma.childApplication.deleteMany({ where: { child: { fullName: childName } } });
  await prisma.$disconnect();
});

const fill = (page: Page, name: string, value: string) => page.locator(`#f-${name}`).fill(value);
const choose = (page: Page, name: string, label: string) => page.locator(`[data-field="${name}"]`).getByText(label, { exact: true }).click();
const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
const heading = (page: Page, name: string) => expect(page.getByRole('heading', { name })).toBeVisible();

async function attach(page: Page, name: string, file: typeof jpeg) {
  await page.locator(`#f-${name}`).setInputFiles(file);
  await expect(page.locator(`[data-field="${name}"]`).getByText(file.name)).toBeVisible();
}

async function noSidewaysScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function fillToReview(page: Page, photo: typeof jpeg) {
  await page.goto('/community-support/register');
  await choose(page, 'completed_by', 'Caretaker');
  await noSidewaysScroll(page);
  await next(page);

  await heading(page, 'Child’s information');
  await fill(page, 'child_name', childName);
  await choose(page, 'child_gender', 'Female');
  await fill(page, 'child_dob', '2015-05-05');
  await fill(page, 'child_birthplace', 'Douala');
  await fill(page, 'child_address', 'Test quarter, near the market');
  await choose(page, 'child_status', 'Lost father');
  await fill(page, 'child_health', 'Confidential health note');
  await attach(page, 'child_photo', photo);
  await noSidewaysScroll(page);
  await next(page);

  await heading(page, 'Parents’ information');
  await choose(page, 'father_state', 'Deceased');
  await fill(page, 'father_death_date', '2023-01-01');
  await choose(page, 'mother_state', 'Living');
  await noSidewaysScroll(page);
  await next(page);

  await heading(page, 'Caretaker or guardian');
  await fill(page, 'caretaker_name', 'E2E Caretaker');
  await page.locator('#f-caretaker_relationship').selectOption('Aunt');
  await page.locator('#f-caretaker_phone').fill('+237 677 000 000');
  await fill(page, 'caretaker_address', 'Test quarter');
  await fill(page, 'caretaker_national_id', 'SECRET-ID-123');
  await next(page);

  await heading(page, 'Two family references');
  for (const n of [1, 2]) {
    await fill(page, `ref${n}_name`, `E2E Reference ${n}`);
    await fill(page, `ref${n}_relationship`, 'Uncle');
    await fill(page, `ref${n}_phone`, '+237 677 000 001');
  }
  await next(page);

  await heading(page, 'IACEC follow-up members and referral');
  await fill(page, 'referred_by', 'E2E Partner');
  await next(page);

  await heading(page, 'Schooling and needs');
  await fill(page, 'school_name', 'E2E School');
  await fill(page, 'school_level', 'Class 4');
  await fill(page, 'fees_year', '45000');
  await next(page);

  await heading(page, 'Proof documents');
  await attach(page, 'doc_birth', pdf);
  await attach(page, 'doc_death', pdf);
  await attach(page, 'doc_caretaker_id', jpeg);
  await attach(page, 'doc_passport', jpeg);
  await next(page);

  await heading(page, 'Declarations and consent');
  for (const name of ['decl_true', 'decl_visits', 'decl_inform', 'decl_activities']) await page.locator(`#f-${name}`).check();
  await page.locator('[data-field="photo_consent"] label').nth(1).click();
  await fill(page, 'signature_name', 'E2E Caretaker');
  await next(page);
  await heading(page, 'Check your answers');
}

test('a full application can be submitted from a phone, with files stored privately', async ({ page }) => {
  await fillToReview(page, jpeg);
  await expect(page.getByText(childName)).toBeVisible();
  await page.getByRole('button', { name: 'Submit application' }).click();

  const reference = page.locator('[data-reference]');
  await expect(reference).toHaveText(/^IACEC-CS-\d{4}-\d{4}$/);
  await expect(page.getByText('An IACEC member will contact you to arrange a home visit.')).toBeVisible();

  const application = await prisma.childApplication.findUniqueOrThrow({
    where: { reference: (await reference.textContent())! },
    include: { child: true, caretaker: true, documents: true, parents: true, references: true, referral: true, schoolRecords: true, statusChanges: true },
  });
  expect(application.status).toBe('NEW');
  expect(application.child?.fullName).toBe(childName);
  expect(application.parents.find((p) => p.role === 'FATHER')?.deceased).toBe(true);
  expect(application.references).toHaveLength(2);
  expect(application.schoolRecords[0].feesDue).toBe(45000);
  expect(application.statusChanges[0].to).toBe('NEW');
  expect(application.photoConsent).toBe(false);

  // Sensitive columns are encrypted.
  expect(application.caretaker?.nationalId).toMatch(/^v1:/);
  expect(application.child?.healthNotes).toMatch(/^v1:/);

  // Optional documents are missing, so the application is flagged.
  expect(application.documents).toHaveLength(5);
  expect(application.documentsComplete).toBe(false);

  // Files sit outside the public folder and cannot be fetched.
  const key = application.documents[0].storageKey;
  expect(existsSync(path.join('.private-uploads', key))).toBe(true);
  expect(existsSync(path.join('public', key))).toBe(false);
  expect((await page.request.get(`/.private-uploads/${key}`)).status()).toBe(404);
  expect((await page.request.get(`/${key}`)).status()).toBe(404);

  // The draft is gone from the phone.
  expect(await page.evaluate(() => localStorage.getItem('iacec-sponsorship-draft'))).toBeNull();
});

test('a file that is not really an image is refused', async ({ page }) => {
  await fillToReview(page, fake);
  await page.getByRole('button', { name: 'Submit application' }).click();
  await heading(page, 'Child’s information');
  await expect(page.getByText('This file could not be read. Please remove it and add it again.')).toBeVisible();
});

test('each step checks its answers', async ({ page }) => {
  await page.goto('/community-support/register');
  await next(page);
  await expect(page.getByText('This field is required.')).toBeVisible();
  await choose(page, 'completed_by', 'IACEC member on behalf of caretaker');
  await expect(page.locator('#f-helper_phone')).toHaveValue('+237 ');
  await next(page);
  await expect(page.getByText('This field is required.').first()).toBeVisible();
  await fill(page, 'helper_name', 'E2E Helper');
  await fill(page, 'helper_phone', '+237 677 000 002');
  await next(page);
  await heading(page, 'Child’s information');
  await page.getByRole('button', { name: 'Back' }).click();
  await heading(page, 'About the programme');
});

test('at least one parent must be marked deceased', async ({ page }) => {
  await page.goto('/community-support/register');
  await page.evaluate(() =>
    localStorage.setItem('iacec-sponsorship-draft', JSON.stringify({ savedAt: Date.now(), step: 2, token: null, values: { father_state: 'LIVING', mother_state: 'LIVING' } })),
  );
  await page.reload();
  await heading(page, 'Parents’ information');
  await next(page);
  await expect(page.getByText('At least one parent must be marked deceased.')).toBeVisible();
});

test('drafts survive a closed tab, but sensitive answers are not kept on the phone', async ({ page }) => {
  await page.goto('/community-support/register');
  await choose(page, 'completed_by', 'Caretaker');
  await next(page);
  await fill(page, 'child_name', 'E2E Draft Child');
  await fill(page, 'child_health', 'Private health note');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('iacec-sponsorship-draft'))).toContain('E2E Draft Child');
  expect(await page.evaluate(() => localStorage.getItem('iacec-sponsorship-draft'))).not.toContain('Private health note');

  await page.reload();
  await expect(page.locator('#f-child_name')).toHaveValue('E2E Draft Child');
  await page.getByRole('button', { name: 'Clear this form from this phone' }).click();
  await heading(page, 'About the programme');
  await page.reload();
  await expect(page.getByText('We found the form you started')).toHaveCount(0);
});

test('the community support page links to the full form', async ({ page }) => {
  await page.goto('/community-support#apply');
  await page.getByRole('link', { name: 'Start the registration form' }).click();
  await expect(page).toHaveURL(/\/community-support\/register/);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Apply for Child Support' }).first()).toHaveAttribute('href', '/community-support/register');
});
