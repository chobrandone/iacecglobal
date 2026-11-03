import { expect, test, type Page } from '@playwright/test';

/** Submits every public form with valid data and checks the live site's success message. */

type Fill = Record<string, string | boolean>;

async function fillForm(page: Page, root: string, values: Fill) {
  const form = page.locator(root);
  for (const [name, value] of Object.entries(values)) {
    const el = form.locator(`[name="${name}"]`);
    const tag = await el.evaluate((n) => n.tagName.toLowerCase());
    const type = await el.getAttribute('type');
    if (type === 'checkbox') {
      if (value) await el.check();
    } else if (tag === 'select') await el.selectOption({ index: 1 });
    else await el.fill(String(value));
  }
}

const person = { full_name: 'Test Person', email: 'test.person@example.com', phone: '+237 600 000 000' };

const cases: { path: string; form: string; values: Fill; success: string }[] = [
  {
    path: '/educators#book',
    form: 'training',
    values: { ...person, organisation: 'Test School', programme: 'x', message: 'Automated test' },
    success: 'Thank you — your request has been received.',
  },
  {
    path: '/students-youth#invite',
    form: 'outreach',
    values: { ...person, organisation: 'Test Church', programme: 'x' },
    success: 'Thank you — your invitation has reached us.',
  },
  { path: '/parents-family#forum', form: 'forum', values: { ...person, role_title: 'x' }, success: 'You are on the forum list.' },
  {
    path: '/community-support#sponsor',
    form: 'sponsor',
    values: { ...person, frequency: 'x', consent: true },
    success: 'Thank you for standing with a child.',
  },
  {
    path: '/community-support#apply',
    form: 'child-application',
    values: { child_full_name: 'Test Child', guardian_full_name: 'Test Guardian', guardian_phone: '+237 600 000 001', consent_confirmed: true },
    success: 'Your application has been received.',
  },
  {
    path: '/partners#become-a-partner',
    form: 'partnership',
    values: { ...person, organisation: 'Test Org', role_title: 'x', programme: 'x' },
    success: 'Thank you — your enquiry has been received.',
  },
  {
    path: '/volunteer#apply',
    form: 'volunteer',
    values: { ...person, programme: 'x', availability: 'x', consent: true },
    success: 'Thank you for offering to serve.',
  },
  { path: '/donate', form: 'giving', values: { ...person, programme: 'x', frequency: 'x' }, success: 'Thank you — we have your giving interest.' },
  { path: '/contact', form: 'contact', values: { ...person, subject: 'x', message: 'Hello from the test suite' }, success: 'Your message has been sent.' },
];

test.describe('forms', () => {
  for (const c of cases) {
    test(`${c.form} form submits`, async ({ page }) => {
      await page.goto(c.path);
      await fillForm(page, `form[data-form="${c.form}"]`, c.values);
      await page.locator(`form[data-form="${c.form}"] button[type="submit"]`).click();
      await expect(page.getByRole('heading', { name: c.success })).toBeVisible();
    });
  }

  test('required fields show the live validation messages', async ({ page }) => {
    await page.goto('/contact');
    await page.locator('form[data-form="contact"] button[type="submit"]').click();
    await expect(page.getByText('This field is required.').first()).toBeVisible();
    await page.locator('form[data-form="contact"] [name="email"]').fill('not-an-email');
    await page.locator('form[data-form="contact"] button[type="submit"]').click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('newsletter sign-up in the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.getByPlaceholder('Your email address').fill(`news.${Date.now()}@example.com`);
    await footer.getByRole('button', { name: 'Subscribe to the newsletter' }).click();
    await expect(footer.getByText('Thank you — you are on the list.')).toBeVisible();
  });
});
