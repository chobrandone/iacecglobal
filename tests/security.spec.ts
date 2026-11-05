import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';
import { clientIp } from '../src/lib/client-fingerprint';
import { checkFormToken, checkTurnstile, issueFormToken, looksLikeSpam, mayAutoReply, mayNotifyStaff } from '../src/lib/form-guard';
import { hit, isBlocked } from '../src/lib/rate-limit';
import { cleanHtml } from '../src/lib/sanitize';

/** Abuse protection: rate limits, form tokens and the limits on who a form can email. */

const prisma = new PrismaClient();

test.describe.configure({ mode: 'serial' });
test.beforeEach(() => prisma.rateLimit.deleteMany());
test.afterAll(async () => {
  await prisma.rateLimit.deleteMany();
  await prisma.$disconnect();
});

test('a limit holds under simultaneous requests', async () => {
  const results = await Promise.all(Array.from({ length: 20 }, () => hit('test:parallel', 5, 60_000)));
  expect(results.filter(Boolean)).toHaveLength(5);
  expect(await isBlocked('test:parallel', 5)).toBe(true);
});

test('a limit resets when its window ends', async () => {
  await hit('test:window', 1, 1);
  await new Promise((r) => setTimeout(r, 20));
  expect(await hit('test:window', 1, 60_000)).toBe(true);
});

test('a faked IP header cannot change who you appear to be', () => {
  const seen = (forwarded: string) => clientIp(new Headers({ 'x-forwarded-for': forwarded }));
  expect(seen('1.1.1.1, 198.51.100.7')).toBe('198.51.100.7');
  expect(seen('8.8.8.8, 2.2.2.2, 198.51.100.7')).toBe('198.51.100.7');
  expect(clientIp(new Headers())).toBe('unknown');
});

test('form tokens must be genuine, old enough, unexpired and unused', async () => {
  const now = Date.now();
  expect(await checkFormToken(undefined)).toBe(false);
  expect(await checkFormToken('junk')).toBe(false);

  const quick = issueFormToken(now);
  expect(await checkFormToken(quick, now + 1000)).toBe(false);

  const expired = issueFormToken(now - 2 * 86_400_000);
  expect(await checkFormToken(expired, now)).toBe(false);

  const good = issueFormToken(now);
  const [issued, nonce, signature] = good.split('.');
  expect(await checkFormToken(`${now - 60_000}.${nonce}.${signature}`, now)).toBe(false);
  expect(issued).toBe(String(now));

  expect(await checkFormToken(good, now + 4000)).toBe(true);
  expect(await checkFormToken(good, now + 5000)).toBe(false);
});

test('one address gets at most two auto-replies a day, however it is written', async () => {
  expect(await mayAutoReply('victim@example.test')).toBe(true);
  expect(await mayAutoReply('VICTIM@example.test ')).toBe(true);
  expect(await mayAutoReply('victim@example.test')).toBe(false);
  expect(await mayAutoReply('someone-else@example.test')).toBe(true);
});

test('the whole site stops auto-replying at the daily cap', async () => {
  const sent = [];
  for (let i = 0; i < 55; i += 1) sent.push(await mayAutoReply(`person${i}@example.test`));
  expect(sent.filter(Boolean)).toHaveLength(50);
});

test('the team is not flooded with notifications', async () => {
  const sent = [];
  for (let i = 0; i < 105; i += 1) sent.push(await mayNotifyStaff());
  expect(sent.filter(Boolean)).toHaveLength(100);
});

test('link spam is recognised, ordinary messages are not', () => {
  expect(looksLikeSpam({ message: 'buy http://a.example https://b.example www.c.example now' })).toBe(true);
  expect(looksLikeSpam({ message: 'Our church website is https://church.example. Please call us.' })).toBe(false);
});

test('Turnstile is skipped without keys, and refuses a missing answer with them', async () => {
  const saved = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  expect(await checkTurnstile(undefined, '1.1.1.1')).toBe(true);
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  expect(await checkTurnstile(undefined, '1.1.1.1')).toBe(false);
  if (saved) process.env.TURNSTILE_SECRET_KEY = saved;
  else delete process.env.TURNSTILE_SECRET_KEY;
});

test('rich text cannot carry scripts', () => {
  const dirty = '<p onclick="steal()">Hi</p><script>steal()</script><img src="x" onerror="steal()"><a href="javascript:steal()">x</a><iframe src="https://evil.example"></iframe>';
  const clean = cleanHtml(dirty);
  expect(clean).not.toMatch(/script|onerror|onclick|javascript:|iframe|steal/i);
  expect(clean).toContain('Hi');
});

test('security headers are sent', async ({ request }) => {
  const headers = (await request.get('/robots.txt')).headers();
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-powered-by']).toBeUndefined();
});
