import { createHash } from 'node:crypto';
import { prisma } from './db';

export const MINUTE = 60_000;
export const DAY = 86_400_000;

/** Keeps emails and IP addresses out of the rate limit table. */
export const hashKey = (value: string) =>
  createHash('sha256')
    .update(value + (process.env.AUTH_SECRET ?? ''))
    .digest('hex')
    .slice(0, 32);

/** Counts one use. False once the limit is passed. One atomic statement, so parallel requests cannot slip through. */
export async function hit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  if (Math.random() < 0.01) await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
  return row.count <= limit;
}

/** True if a key is already over its limit, without counting this check. */
export async function isBlocked(key: string, limit: number) {
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  return !!row && row.resetAt > new Date() && row.count >= limit;
}

export const clearLimit = (key: string) => prisma.rateLimit.deleteMany({ where: { key } });
