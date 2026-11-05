import type { PrismaClient } from '@prisma/client';
import { TABLES, type Dump, type Row, type TableName } from './dump';

type Writer = { createMany(args: { data: Row[] }): Promise<unknown>; upsert(args: unknown): Promise<unknown>; count(): Promise<number> };

/**
 * Restores a backup into an empty database. Children in a tombstone, from this backup or a newer one,
 * were permanently deleted and stay deleted. Coordinators are unassigned, because users are not in backups.
 */
export async function restoreDump(db: PrismaClient, dump: Dump, extraTombstones: string[] = []) {
  if (await db.childApplication.count()) throw new Error('This database already has applications. Restore only into an empty database.');

  const deleted = new Set([...dump.tables.deletionTombstone.map((t) => t.reference as string), ...extraTombstones]);
  const removedApplications = new Set(dump.tables.childApplication.filter((a) => deleted.has(a.reference as string)).map((a) => a.id as string));
  const removedChildren = new Set(dump.tables.child.filter((c) => removedApplications.has(c.applicationId as string)).map((c) => c.id as string));
  const removedRecords = new Set(dump.tables.schoolRecord.filter((r) => removedApplications.has(r.applicationId as string)).map((r) => r.id as string));
  const removedVisits = new Set(dump.tables.visitLog.filter((v) => removedChildren.has(v.childId as string)).map((v) => v.id as string));

  const keep = (row: Row) =>
    !removedApplications.has((row.applicationId ?? row.id) as string) && !removedChildren.has(row.childId as string) && !removedRecords.has(row.schoolRecordId as string) && !removedVisits.has(row.visitLogId as string);

  const counts: Partial<Record<TableName, number>> = {};
  for (const table of TABLES) {
    const writer = db[table] as unknown as Writer;
    let rows = table === 'auditLog' ? dump.tables[table] : dump.tables[table].filter(keep);
    if (table === 'childApplication') rows = rows.map((r) => ({ ...r, assignedToId: null }));
    if (table === 'sponsorshipSettings') {
      for (const row of rows) await writer.upsert({ where: { id: row.id }, create: row, update: row });
    } else if (rows.length) {
      await writer.createMany({ data: rows });
    }
    counts[table] = rows.length;
  }
  return counts;
}
