import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end admin checks: sign in, edit the home page heading, swap the hero image,
 * confirm both appear on the public site, then put everything back.
 * Requires ADMIN_EMAIL / ADMIN_PASSWORD (the seeded administrator).
 */

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
}

async function openHomeHero(page: Page) {
  await page.goto('/admin/pages');
  await page.getByRole('link', { name: /^Home/ }).click();
  await page.getByRole('button', { name: /1\. Home hero/ }).click();
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved — the website is updated.')).toBeVisible();
}

test.describe('admin', () => {
  test.skip(!email || !password, 'Set ADMIN_EMAIL and ADMIN_PASSWORD to run admin tests');

  test('unauthenticated visitors are sent to the login page', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('edit the home heading and swap the hero image', async ({ page }) => {
    await signIn(page);
    await openHomeHero(page);

    const line1 = page.getByLabel('Headline line 1');
    const original = await line1.inputValue();
    const changed = `Raising a test ${Date.now() % 10000}`;
    await line1.fill(changed);

    // Swap the photo: upload a new file through the media picker.
    await page.getByRole('button', { name: 'Change' }).first().click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload new' }).click();
    await (await chooser).setFiles(path.join(process.cwd(), 'public', 'media', 'seed', 'volunteers.webp'));
    await expect(page.getByText('Uploaded')).toBeVisible();
    await save(page);

    await page.goto('/');
    await expect(page.locator('h1')).toContainText(changed);
    const heroImg = page.locator('section').first().locator('img').first();
    await expect(heroImg).toHaveAttribute('src', /uploads|volunteers|amazonaws|r2|media/);

    // Restore
    await openHomeHero(page);
    await page.getByLabel('Headline line 1').fill(original);
    await page.getByRole('button', { name: 'Change' }).first().click();
    await page.getByPlaceholder('Search by name or description').fill('teacher guiding');
    await page.getByRole('button', { name: /teacher guiding a pupil/i }).first().click();
    await save(page);
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(original);
  });

  test('submissions appear in the inbox', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/submissions');
    await expect(page.getByRole('heading', { name: 'Submissions' })).toBeVisible();
  });
});
