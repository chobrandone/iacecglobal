import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { routes, widths } from './routes';

/**
 * Visual parity with the live site. Each route is rendered at 1440 / 768 / 390 px with animations
 * disabled and compared against reference-screenshots/<route>/<width>.png (captured from the live site).
 *
 * The comparison is done with Playwright's own image diff (toMatchSnapshot) against the reference
 * file; the threshold is small, and the WhatsApp button and dynamic copyright year are masked.
 */

const REF_DIR = path.join(process.cwd(), 'reference-screenshots');

async function settle(page: Page) {
  await page.addStyleTag({
    content: '*{animation:none!important;transition:none!important;caret-color:transparent!important} .reveal{opacity:1!important;transform:none!important}',
  });
  // Scroll through the page so lazy images load, then return to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

for (const route of routes) {
  for (const width of widths) {
    test(`visual ${route.path} @ ${width}px`, async ({ page }, info) => {
      const ref = path.join(REF_DIR, route.name, `${width}.png`);
      test.skip(!existsSync(ref), `No reference screenshot for ${route.name} at ${width}px`);

      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path);
      await expect(page.locator('h1').first()).toHaveText(route.h1);
      await settle(page);

      // Store the reference as this test's snapshot so toMatchSnapshot compares against the live site.
      const snapshotName = `${route.name}-${width}.png`;
      const snapPath = info.snapshotPath(snapshotName);
      mkdirSync(path.dirname(snapPath), { recursive: true });
      writeFileSync(snapPath, readFileSync(ref));

      const shot = await page.screenshot({
        fullPage: true,
        mask: [page.locator('a[href^="https://wa.me"]'), page.locator('footer p').filter({ hasText: '©' })],
      });
      expect(shot).toMatchSnapshot(snapshotName, { maxDiffPixelRatio: 0.02, threshold: 0.2 });
    });
  }
}
