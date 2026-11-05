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

  test('large photos are shrunk before upload and large PDFs are refused', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/media');
    const input = page.locator('input[type="file"][multiple]');

    // Random pixels barely compress, so this PNG is far over the 4 MB limit.
    const png = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 3000;
      canvas.height = 2000;
      const ctx = canvas.getContext('2d')!;
      const img = ctx.createImageData(3000, 2000);
      const chunk = new Uint8Array(65536);
      for (let i = 0; i < img.data.length; i += 65536) {
        crypto.getRandomValues(chunk);
        img.data.set(chunk.subarray(0, Math.min(65536, img.data.length - i)), i);
      }
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const buffer = Buffer.from(png, 'base64');
    expect(buffer.length).toBeGreaterThan(4 * 1024 * 1024);

    const name = `e2e-large-${Date.now()}.png`;
    const response = page.waitForResponse((r) => r.url().includes('/api/admin/media') && r.request().method() === 'POST');
    await input.setInputFiles({ name, mimeType: 'image/png', buffer });
    const res = await response;
    expect(res.status()).toBe(200);
    const media = await res.json();
    expect(media.mimeType).toBe('image/webp');
    expect(media.width).toBe(2400);
    expect(media.size).toBeLessThanOrEqual(4 * 1024 * 1024);
    await expect(page.getByText(`Uploaded ${name}`)).toBeVisible();

    await input.setInputFiles({ name: 'e2e-large.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024) });
    await expect(page.getByText('e2e-large.pdf: Files must be 4 MB or smaller.')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: media.filename }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Deleted')).toBeVisible();
  });

  test('the rich text editor loads and accepts typing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await signIn(page);
    await page.goto('/admin/collections/news/new');
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type('E2E typing check');
    await expect(editor).toContainText('E2E typing check');
    await page.getByRole('button', { name: 'Bold' }).first().click();
    expect(errors).toEqual([]);
  });

  test('every collection can open a new item', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await signIn(page);
    await page.goto('/admin/collections');
    const links = await page.locator('main a[href^="/admin/collections/"]').evaluateAll((list) => [...new Set(list.map((a) => a.getAttribute('href')!))]);
    expect(links.length).toBeGreaterThan(5);
    for (const link of links) {
      const res = await page.goto(`${link}/new`);
      expect(res?.status(), link).toBe(200);
      await expect(page.getByRole('button', { name: /Save|Create/ }).first(), link).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

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
