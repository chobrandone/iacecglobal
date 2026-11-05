import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma sizes its pool from the server's CPU count, which on shared hosting is more than the
 * database allows. A small pool with a longer wait rides out bursts of visitors.
 * Values already set in DATABASE_URL win.
 */
function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5');
  if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '30');
  return url.toString();
}

// Kept on globalThis in production too, so separately bundled routes share one pool.
export const prisma = (globalForPrisma.prisma ??= new PrismaClient({ datasourceUrl: databaseUrl() }));
