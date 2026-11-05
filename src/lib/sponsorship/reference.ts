import type { PrismaClient } from '@prisma/client';

const yearInDouala = (date: Date) => Number(new Intl.DateTimeFormat('en', { timeZone: 'Africa/Douala', year: 'numeric' }).format(date));

/** Next number such as IACEC-CS-2026-0001. One atomic statement, so two submissions can never share a number. */
export async function nextReference(db: Pick<PrismaClient, '$queryRaw'>, date = new Date()) {
  const year = yearInDouala(date);
  const [row] = await db.$queryRaw<{ last: number }[]>`
    INSERT INTO "ReferenceCounter" ("year", "last") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "last" = "ReferenceCounter"."last" + 1
    RETURNING "last"`;
  return `IACEC-CS-${year}-${String(row.last).padStart(4, '0')}`;
}
