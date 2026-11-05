import { expect, test } from '@playwright/test';
import { routes } from './routes';

test.describe('public site', () => {
  for (const route of routes) {
    test(`${route.path} renders with the right heading and metadata`, async ({ page }) => {
      const res = await page.goto(route.path);
      expect(res?.status()).toBe(200);
      expect((await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim()).toBe(route.h1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /iacecglobal\.com/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{20,}/);
    });
  }

  test('global chrome: contact bar, nav, Get Involved menu, footer, WhatsApp', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'info@iacecglobal.com' }).first()).toHaveAttribute('href', 'mailto:info@iacecglobal.com');
    await expect(page.locator('a[href="tel:+237677721678"]').first()).toBeVisible();
    await expect(page.locator('a[href="tel:+14057620857"]').first()).toBeVisible();
    await page.getByRole('button', { name: 'Get Involved' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveCount(7);
    await expect(menu.getByRole('menuitem', { name: 'Volunteer With Us' })).toHaveAttribute('href', '/volunteer');
    await expect(page.locator('a[href="https://wa.me/237677721678"]')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('Stay in touch');
    await expect(page.getByText('Made with Base44')).toHaveCount(0);
  });

  test('mobile menu opens and lists the pages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Site menu' });
    await expect(dialog.getByRole('link', { name: 'Mission & Values' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Contact us' })).toBeVisible();
  });

  test('programme filters work', async ({ page }) => {
    await page.goto('/programmes');
    await expect(page.locator('article')).toHaveCount(10);
    await page.getByRole('button', { name: 'Families' }).click();
    await expect(page.locator('article')).toHaveCount(2);
  });

  test('unknown routes return the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  });

  test('sitemap and robots', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('/programmes/child-sponsorship-programme');
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /admin');
  });
});
