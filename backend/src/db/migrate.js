import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[MIGRATE] Running database migrations...');
  if (db.isUsingMemoryStore()) {
    console.log('[MIGRATE] Running in memory mode, schema is natively initialized.');
    return;
  }

  const sqlPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await db.query(sql);
    console.log('[MIGRATE] Migrations applied successfully to PostgreSQL.');
  } catch (err) {
    console.error('[MIGRATE] Migration failed:', err.message);
    throw err;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
