// Starts a throw-away PostgreSQL server for local development (no Docker needed).
// Usage: npm run db:local   → then use DATABASE_URL=postgresql://postgres:postgres@localhost:5433/iacec
import { existsSync } from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const dataDir = path.join(process.cwd(), '.pgdata');
const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'postgres', password: 'postgres', port: 5433, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'] });

if (!existsSync(path.join(dataDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('iacec');
} catch {
  // already exists
}
console.log('PostgreSQL running → postgresql://postgres:postgres@localhost:5433/iacec  (Ctrl+C to stop)');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
