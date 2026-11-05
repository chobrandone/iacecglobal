/* eslint-disable no-console */
// Restores the sponsorship tables from a backup into an empty database.
// Usage: npm run restore -- <backup.json.gz> [--newer <latest-backup.json.gz>]
// Pass --newer when restoring an old backup, so children deleted since then stay deleted.
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { unpackDump } from '../src/lib/drive/dump';
import { restoreDump } from '../src/lib/drive/restore';

async function main() {
  const [file, flag, newer] = process.argv.slice(2);
  if (!file) throw new Error('Usage: npm run restore -- <backup.json.gz> [--newer <latest-backup.json.gz>]');
  const dump = unpackDump(readFileSync(file));
  const tombstones = flag === '--newer' && newer ? unpackDump(readFileSync(newer)).tables.deletionTombstone.map((t) => t.reference as string) : [];

  const prisma = new PrismaClient();
  try {
    const counts = await restoreDump(prisma, dump, tombstones);
    console.log(`Restored from the backup of ${dump.createdAt}:`);
    console.table(counts);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exitCode = 1;
});
