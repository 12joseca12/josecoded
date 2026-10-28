// Computes supabase/schema/baseline.meta.json from the dumped baseline.sql.
// Usage: node supabase/scripts/baseline-meta.ts <baseline.sql> <baseline.meta.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [sqlPath, metaPath] = process.argv.slice(2);
if (!sqlPath || !metaPath) {
  console.error('usage: baseline-meta.ts <baseline.sql> <baseline.meta.json>');
  process.exit(2);
}

const sql = readFileSync(sqlPath, 'utf8');

const tables = [
  ...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?public"?\."?(\w+)"?/g),
].map((m) => m[1]);
const policies = (sql.match(/CREATE POLICY/g) ?? []).length;
const functions = [
  ...sql.matchAll(/CREATE (?:OR REPLACE )?FUNCTION "?(\w+)"?\."?(\w+)"?/g),
].map((m) => `${m[1]}.${m[2]}`);

const meta = {
  dumpedAt: new Date().toISOString(),
  tables: tables.length,
  policies,
  functions: functions.length,
};

writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
console.log(`baseline.meta.json: ${JSON.stringify(meta)}`);
