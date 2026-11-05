import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { decrypt, encrypt } from '../../src/lib/sponsorship/encryption';
import { nextReference } from '../../src/lib/sponsorship/reference';

/** Foundations of the sponsorship system. Requires a local database and DATA_ENCRYPTION_KEY. */

const prisma = new PrismaClient();
const password = `test-${Date.now()}-Aa1`;
const users: Record<string, { email: string; role: Role }> = {
  editor: { email: 'e2e-editor@example.test', role: 'EDITOR' },
  coordinator: { email: 'e2e-coordinator@example.test', role: 'SPONSORSHIP_COORDINATOR' },
};

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  for (const u of Object.values(users)) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: `E2E ${u.role}`, role: u.role, passwordHash },
      update: { passwordHash, active: true, role: u.role },
    });
  }
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(users).map((u) => u.email) } } });
  await prisma.$disconnect();
});

async function signIn(page: Page, email: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
}

test.describe('encryption', () => {
  test('round trip, with a different result each time', () => {
    const a = encrypt('ID-123456');
    expect(a).not.toContain('ID-123456');
    expect(a).not.toBe(encrypt('ID-123456'));
    expect(decrypt(a)).toBe('ID-123456');
  });

  test('tampered data is refused', () => {
    const parts = encrypt('ID-123456').split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});

test('reference numbers never repeat under simultaneous submissions', async () => {
  const date = new Date('2099-06-15T12:00:00Z');
  await prisma.referenceCounter.deleteMany({ where: { year: 2099 } });
  const refs = await Promise.all(Array.from({ length: 25 }, () => nextReference(prisma, date)));
  expect(new Set(refs).size).toBe(25);
  expect(refs.sort()[0]).toBe('IACEC-CS-2099-0001');
  await prisma.referenceCounter.deleteMany({ where: { year: 2099 } });
});

test('reference year follows Douala time, not UTC', async () => {
  const ref = await nextReference(prisma, new Date('2098-12-31T23:30:00Z'));
  expect(ref).toMatch(/^IACEC-CS-2099-/);
  await prisma.referenceCounter.deleteMany({ where: { year: 2099 } });
});

test.describe('access', () => {
  test('signed-out visitors are sent to the login page', async ({ page }) => {
    await page.goto('/admin/sponsorship');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('an Editor cannot open sponsorship pages or see the menu link', async ({ page }) => {
    await signIn(page, users.editor.email);
    await expect(page.getByRole('link', { name: 'Sponsorship', exact: true })).toHaveCount(0);
    await page.goto('/admin/sponsorship');
    await expect(page).toHaveURL(/\/admin\?denied=1/);
    await expect(page.getByText('Total applications')).toHaveCount(0);
  });

  test('a Coordinator can open it, and the visit is audited with the IP address', async ({ page }) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: users.coordinator.email } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await signIn(page, users.coordinator.email);
    await page.getByRole('link', { name: 'Sponsorship', exact: true }).click();
    await expect(page.getByText('Total applications')).toBeVisible();
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { userId: user.id, entity: 'sponsorship-overview' } });
    expect(entry.action).toBe('view');
    expect(entry.ip).toBeTruthy();
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
  });
});

test('the word "orphan" appears nowhere in public text or emails', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const file = path.join(dir, name);
      return statSync(file).isDirectory() ? walk(file) : [file];
    });
  const files = [...walk('src'), ...walk('prisma/seed-data')].filter((f) => /\.tsx?$/.test(f));
  expect(files.filter((f) => /orphan/i.test(readFileSync(f, 'utf8')))).toEqual([]);
});
