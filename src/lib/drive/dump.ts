import { gunzipSync, gzipSync } from 'node:zlib';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { decryptOptional } from '@/lib/sponsorship/encryption';
import { toWorkbook } from '@/lib/sponsorship/export';

/** In the order a restore must insert them, parents first. Backup runs and Drive links are not data to restore. */
export const TABLES = [
  'sponsor',
  'childApplication',
  'child',
  'sibling',
  'parent',
  'caretaker',
  'familyReference',
  'careTeamMember',
  'referral',
  'schoolRecord',
  'visitLog',
  'applicationDocument',
  'feePayment',
  'materialSupport',
  'verification',
  'statusChange',
  'sponsorship',
  'sponsorReport',
  'internalNote',
  'fieldChange',
  'auditLog',
  'referenceCounter',
  'deletionTombstone',
  'sponsorshipSettings',
] as const;

export type TableName = (typeof TABLES)[number];
export type Row = Record<string, unknown>;
export type Dump = { version: 1; createdAt: string; tables: Record<TableName, Row[]> };

type Reader = { findMany(): Promise<Row[]> };

/** Sensitive columns stay encrypted here, so restoring needs DATA_ENCRYPTION_KEY. The Google token is never included. */
export async function dumpTables(db: PrismaClient = prisma): Promise<Dump> {
  const entries = await Promise.all(TABLES.map(async (name) => [name, await (db[name] as unknown as Reader).findMany()] as const));
  const tables = Object.fromEntries(entries) as Dump['tables'];
  tables.sponsorshipSettings = tables.sponsorshipSettings.map((row) => ({ ...row, googleRefreshToken: null }));
  return { version: 1, createdAt: new Date().toISOString(), tables };
}

export const packDump = (dump: Dump) => gzipSync(JSON.stringify(dump));
export const unpackDump = (file: Buffer) => JSON.parse(gunzipSync(file).toString('utf8')) as Dump;

const sheets: [string, TableName][] = [
  ['Applications', 'childApplication'],
  ['Children', 'child'],
  ['Caretakers', 'caretaker'],
  ['Family references', 'familyReference'],
  ['Care team', 'careTeamMember'],
  ['Sponsors', 'sponsor'],
  ['Visits', 'visitLog'],
  ['Fees', 'feePayment'],
  ['Material support', 'materialSupport'],
  ['Status history', 'statusChange'],
];

const cell = (v: unknown) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : typeof v === 'number' ? v : String(v));

/** One sheet per table. Sensitive columns appear only in files that will be encrypted. */
export function dumpWorkbook(dump: Dump, includeSensitive: boolean) {
  const sensitive = ['nationalId', 'healthNotes'];
  return toWorkbook(
    sheets.map(([name, table]) => {
      const rows = dump.tables[table];
      const headers = Object.keys(rows[0] ?? {}).filter((h) => includeSensitive || !sensitive.includes(h));
      return {
        name,
        headers,
        rows: rows.map((row) => headers.map((h) => (sensitive.includes(h) ? (decryptOptional(row[h] as string | null) ?? '') : cell(row[h])))),
      };
    }),
  );
}
