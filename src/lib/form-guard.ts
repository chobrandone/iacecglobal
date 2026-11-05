import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { DAY, MINUTE, hashKey, hit } from './rate-limit';

/** Protection for public forms against bots, and against using them to email strangers. */

const MIN_AGE_MS = 3_000; // people take longer than this to fill in a form
const MAX_AGE_MS = DAY;
const MAX_LINKS = 2;

export type FormGuard = { token?: string; turnstile?: string };

const sign = (payload: string) =>
  createHmac('sha256', process.env.AUTH_SECRET ?? '')
    .update(payload)
    .digest('base64url');

export function issueFormToken(now = Date.now()) {
  const payload = `${now}.${randomBytes(12).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

/** Valid only if signed by this site, old enough to have been filled in by a person, and never used before. */
export async function checkFormToken(token: string | undefined, now = Date.now()) {
  const [issued, nonce, signature] = (token ?? '').split('.');
  if (!issued || !nonce || !signature) return false;
  const expected = Buffer.from(sign(`${issued}.${nonce}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  const age = now - Number(issued);
  if (!(age >= MIN_AGE_MS && age <= MAX_AGE_MS)) return false;
  return hit(`form-token:${nonce}`, 1, MAX_AGE_MS);
}

/** Cloudflare Turnstile, when its keys are set. Without them, this check is skipped. */
export async function checkTurnstile(response: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!response) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response, remoteip: ip }),
  }).catch(() => null);
  const result = (await res?.json().catch(() => null)) as { success?: boolean } | null;
  return result?.success === true;
}

/** Limits from one connection, and in total so that a botnet cannot get round the per-connection limit. */
export async function withinSubmissionLimits(ipHash: string) {
  return (await hit(`form:ip:${ipHash}`, 6, 10 * MINUTE)) && (await hit(`form:ip-day:${ipHash}`, 20, DAY)) && (await hit('form:all-day', 300, DAY));
}

/**
 * Auto-replies go to whatever address was typed, so they are the way a form could be used to email
 * strangers. Each address gets at most two a day, and there is a daily total for the whole site.
 */
export async function mayAutoReply(address: string) {
  return (await hit(`mail:to:${hashKey(address.trim().toLowerCase())}`, 2, DAY)) && (await hit('mail:auto-reply-day', 50, DAY));
}

/** Stops a flood reaching the team's inbox. Submissions past this are still saved in the admin. */
export const mayNotifyStaff = () => hit('mail:staff-day', 100, DAY);

export function looksLikeSpam(values: Record<string, unknown>) {
  const text = Object.values(values).filter((v) => typeof v === 'string').join(' ');
  return (text.match(/https?:\/\/|www\./gi) ?? []).length > MAX_LINKS;
}
