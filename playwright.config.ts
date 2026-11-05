import { defineConfig, devices } from '@playwright/test';

// Tests that talk to the database or decrypt data read the same .env as the app.
try {
  process.loadEnvFile();
} catch {
  // No .env file, for example in CI.
}

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Use an installed Chrome/Edge when Playwright's bundled browsers are not downloaded.
    channel: process.env.PW_CHANNEL || undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } }],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run start', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
