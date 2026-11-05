import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { decrypt, encrypt } from '../../src/lib/sponsorship/encryption';

/** The sponsorship admin, used as a Coordinator, with an Editor as the outsider. */

const prisma = new PrismaClient();
const password = `test-${Date.now()}-Aa1`;
const coordinator = 'e2e-admin-coordinator@example.test';
const editor = 'e2e-admin-editor@example.test';
const reference = `IACEC-CS-E2E-${Date.now()}`;
const pdf = { name: 'proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test\n') };
let id = '';
let documentId = '';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({ where: { email: coordinator }, create: { email: coordinator, name: 'E2E Coordinator', role: 'SPONSORSHIP_COORDINATOR', passwordHash }, update: { passwordHash } });
  await prisma.user.upsert({ where: { email: editor }, create: { email: editor, name: 'E2E Editor', role: 'EDITOR', passwordHash }, update: { passwordHash } });
  const application = await prisma.childApplication.create({
    data: {
      reference,
      isTest: true,
      declarations: { truthful: true, visits: true, inform: true, activities: true },
      signatureName: 'E2E Aunt',
      signatureDate: new Date('2026-11-01'),
      child: { create: { fullName: 'E2E Profile Child', gender: 'FEMALE', dateOfBirth: new Date('2015-01-01'), placeOfBirth: 'Douala', address: 'Test quarter', status: 'LOST_FATHER', healthNotes: encrypt('Old health note') } },
      parents: { create: [{ role: 'FATHER', deceased: true }, { role: 'MOTHER', deceased: false }] },
      caretaker: { create: { fullName: 'E2E Aunt', relationship: 'Aunt', phones: ['+237 677 000 000'], address: 'Test quarter', nationalId: encrypt('ID-777') } },
      references: { create: [1, 2].map((position) => ({ position, fullName: `E2E Ref ${position}`, relationship: 'Uncle', phone: '+237 677 000 001' })) },
      referral: { create: { referredBy: 'E2E Partner' } },
      schoolRecords: { create: { schoolYear: '2026/2027', school: 'E2E School', level: 'Class 3', feesDue: 50000 } },
      documents: { create: { type: 'BIRTH_CERTIFICATE', storageKey: `e2e/${Date.now()}.pdf`, filename: 'birth.pdf', mimeType: 'application/pdf', size: 10 } },
    },
    include: { documents: true },
  });
  id = application.id;
  documentId = application.documents[0].id;
});

test.afterAll(async () => {
  await prisma.childApplication.deleteMany({ where: { OR: [{ id }, { child: { fullName: 'E2E Paper Child' } }] } });
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

const profile = (tab: string) => `/admin/sponsorship/applications/${id}?tab=${tab}`;

test('an Editor cannot reach the list, a profile or a file', async ({ page }) => {
  await signIn(page, editor);
  for (const path of ['/admin/sponsorship/applications', profile('application'), '/admin/sponsorship/applications/new']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\?denied=1/);
  }
  expect((await page.request.get(`/api/sponsorship/files/${documentId}`)).status()).toBe(403);
});

test('signed-out visitors cannot open a file', async ({ request }) => {
  expect((await request.get(`/api/sponsorship/files/${documentId}`)).status()).toBe(401);
});

test.describe('as a Coordinator', () => {
  test.beforeEach(({ page }) => signIn(page, coordinator));

  test('search, filter and sort the list', async ({ page }) => {
    await page.goto('/admin/sponsorship/applications');
    await page.getByLabel('Search').fill('E2E Profile');
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.getByRole('link', { name: reference })).toBeVisible();
    await expect(page.getByText('1 application.')).toBeVisible();

    await page.goto('/admin/sponsorship/applications?q=E2E+Profile&gender=MALE');
    await expect(page.getByText('No applications match.')).toBeVisible();
    await page.goto('/admin/sponsorship/applications?q=E2E+Profile&minAge=5&maxAge=15&docs=no&school=E2E');
    await expect(page.getByRole('link', { name: reference })).toBeVisible();
    await page.getByRole('link', { name: /^Child/ }).click();
    await expect(page).toHaveURL(/sort=child/);
  });

  test('bulk status change and assignment are logged', async ({ page }) => {
    await page.goto('/admin/sponsorship/applications?q=E2E+Profile');
    await page.getByLabel(`Select ${reference}`).check();
    await page.locator('#bulk-status').selectOption('CONTACTED');
    await page.locator('#bulk-coordinator').selectOption({ label: 'E2E Coordinator' });
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('1 updated')).toBeVisible();
    const row = await prisma.childApplication.findUniqueOrThrow({ where: { id }, include: { statusChanges: true, assignedTo: true } });
    expect(row.status).toBe('CONTACTED');
    expect(row.assignedTo?.email).toBe(coordinator);
    expect(row.statusChanges.at(-1)).toMatchObject({ from: 'NEW', to: 'CONTACTED', userName: 'E2E Coordinator' });
  });

  test('edits are saved with history, and sensitive values stay out of it', async ({ page }) => {
    await page.goto(profile('application'));
    await expect(page.locator('#f-caretaker_national_id')).toHaveValue('ID-777');
    await page.locator('#f-child_church').fill('E2E Church');
    await page.locator('#f-caretaker_national_id').fill('ID-888');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('E2E Coordinator: Church attended: — → E2E Church')).toBeVisible();

    const row = await prisma.childApplication.findUniqueOrThrow({ where: { id }, include: { caretaker: true, fieldChanges: true, child: true } });
    expect(decrypt(row.caretaker!.nationalId)).toBe('ID-888');
    expect(decrypt(row.child!.healthNotes!)).toBe('Old health note');
    const idChange = row.fieldChanges.find((c) => c.field === 'National ID card number')!;
    expect(idChange.oldValue).toBeNull();
    expect(idChange.newValue).toBeNull();
    expect(JSON.stringify(row.fieldChanges)).not.toContain('ID-888');
  });

  test('documents can be added, opened, verified and replaced, and opening is audited', async ({ page }) => {
    await page.goto(profile('documents'));
    await expect(page.getByText('Documents incomplete')).toBeVisible();

    const slot = page.locator('div.rounded-xl', { hasText: 'Caretaker’s national ID card' }).first();
    await slot.locator('input[type="file"]').setInputFiles(pdf);
    await expect(slot.getByText('proof.pdf')).toBeVisible();
    await slot.getByRole('button', { name: 'Mark verified' }).click();
    await expect(slot.getByRole('button', { name: 'Unverify' })).toBeVisible();

    const doc = await prisma.applicationDocument.findFirstOrThrow({ where: { applicationId: id, type: 'CARETAKER_ID' } });
    expect(doc.verified).toBe(true);
    const res = await page.request.get(`/api/sponsorship/files/${doc.id}?download=1`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-disposition']).toContain('attachment');
    expect(await prisma.auditLog.count({ where: { entity: 'document', entityId: doc.id, action: 'download', userName: 'E2E Coordinator' } })).toBe(1);

    await slot.locator('li input[type="file"]').setInputFiles({ ...pdf, name: 'replacement.pdf' });
    await expect(slot.getByText('replacement.pdf')).toBeVisible();
    await expect(slot.getByRole('button', { name: 'Mark verified' })).toBeVisible();
  });

  test('verification decision updates the status', async ({ page }) => {
    await prisma.childApplication.update({ where: { id }, data: { status: 'VERIFIED' } });
    await page.goto(profile('verification'));
    await page.getByLabel('Visited by').fill('E2E Visitor');
    await page.getByLabel('Decision', { exact: true }).selectOption('WAITING_LIST');
    await page.getByRole('button', { name: 'Save verification' }).click();
    await expect(page.getByText('Saved')).toBeVisible();
    await expect.poll(async () => (await prisma.childApplication.findUniqueOrThrow({ where: { id } })).status).toBe('WAITING_LIST');
  });

  test('care team warning, visits, fees, material support and notes', async ({ page }) => {
    await page.goto(profile('care-team'));
    await expect(page.getByRole('alert').filter({ hasText: 'two IACEC members' })).toContainText('This child has 2 and 0');

    await page.goto(profile('visits'));
    await page.getByLabel('Date *').fill('2026-11-02');
    await page.getByLabel('By whom *').fill('E2E Visitor');
    await page.getByLabel('Type *').selectOption('HOME');
    await page.getByLabel('Child’s wellbeing *').selectOption('CONCERN');
    await page.getByRole('button', { name: 'Save visit' }).click();
    await expect(page.locator('span', { hasText: /^Concern$/ })).toBeVisible();

    await page.goto(profile('school'));
    await page.getByText('Record a payment').click();
    await page.getByLabel('Amount paid (FCFA) *').fill('20000');
    await page.getByLabel('Date paid *').fill('2026-11-03');
    await page.getByRole('button', { name: 'Save payment' }).click();
    await expect(page.locator('[data-balance]')).toContainText('30');

    await page.goto(profile('material'));
    await page.getByLabel('Item *').fill('Uniform');
    await page.getByLabel('Date *').fill('2026-11-03');
    await page.getByRole('button', { name: 'Save support' }).click();
    await expect(page.getByText(/Uniform/)).toBeVisible();

    await page.goto(profile('notes'));
    await page.getByLabel('New note *').fill('E2E internal note');
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByText('E2E internal note')).toBeVisible();
    await expect(page.getByText(/E2E Coordinator ·/)).toBeVisible();
  });

  test('exiting a child needs a reason', async ({ page }) => {
    await prisma.childApplication.update({ where: { id }, data: { status: 'ACCEPTED' } });
    await page.goto(profile('notes'));
    await page.locator('#status').selectOption('EXITED');
    await page.getByRole('button', { name: 'Update status' }).click();
    await expect(page.getByText('Please give the exit reason.')).toBeVisible();
    await page.locator('#exit-reason').selectOption('Other');
    await page.getByLabel('Other exit reason').fill('Moved away');
    await page.getByRole('button', { name: 'Update status' }).click();
    await expect(page.getByText('Status updated')).toBeVisible();
    await expect.poll(async () => (await prisma.childApplication.findUniqueOrThrow({ where: { id } })).exitReason).toBe('Moved away');
  });

  test('a paper form can be entered', async ({ page }) => {
    await page.goto('/admin/sponsorship/applications/new');
    await page.getByRole('button', { name: 'Save application' }).click();
    await expect(page.getByText('This field is required.').first()).toBeVisible();

    const fill = (name: string, value: string) => page.locator(`#f-${name}`).fill(value);
    const choose = (name: string, label: string) => page.locator(`[data-field="${name}"]`).getByText(label, { exact: true }).click();
    await fill('helper_name', 'E2E Coordinator');
    await fill('helper_phone', '+237 677 000 002');
    await fill('child_name', 'E2E Paper Child');
    await choose('child_gender', 'Male');
    await fill('child_dob', '2014-02-02');
    await fill('child_birthplace', 'Buea');
    await fill('child_address', 'Test quarter');
    await choose('child_status', 'Lost both parents');
    await choose('father_state', 'Deceased');
    await choose('mother_state', 'Deceased');
    await fill('caretaker_name', 'E2E Grandparent');
    await page.locator('#f-caretaker_relationship').selectOption('Grandparent');
    await fill('caretaker_phone', '+237 677 000 003');
    await fill('caretaker_address', 'Test quarter');
    await fill('caretaker_national_id', 'PAPER-ID');
    for (const n of [1, 2]) {
      await fill(`ref${n}_name`, `Paper Ref ${n}`);
      await fill(`ref${n}_relationship`, 'Aunt');
      await fill(`ref${n}_phone`, '+237 677 000 004');
    }
    await fill('referred_by', 'E2E Partner');
    await fill('school_name', 'Paper School');
    await fill('school_level', 'Class 5');
    await fill('fees_year', '30000');
    for (const name of ['decl_true', 'decl_visits', 'decl_inform', 'decl_activities']) await page.locator(`#f-${name}`).check();
    await page.locator('[data-field="photo_consent"] label').nth(1).click();
    await fill('signature_name', 'E2E Grandparent');
    await fill('signature_date', '2026-11-03');
    await page.getByRole('button', { name: 'Save application' }).click();

    await expect(page).toHaveURL(/tab=documents/);
    const row = await prisma.childApplication.findFirstOrThrow({ where: { child: { fullName: 'E2E Paper Child' } } });
    expect(row.source).toBe('PAPER');
    expect(row.reference).toMatch(/^IACEC-CS-\d{4}-\d{4}$/);
  });
});
