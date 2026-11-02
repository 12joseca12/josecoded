// The per-screen catalogs (messages/<locale>/<screen>.json) read from disk. Shared by `i18n-check` and `merge-overrides`.
// Runs with plain Node (type stripping, Node >= 22.18).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Catalogs = Record<string, Record<string, unknown>>;

export function loadCatalogs(locale: string, root = join(import.meta.dirname, '..', 'messages')) {
  const dir = join(root, locale);
  const catalogs: Catalogs = {};
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    catalogs[file.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  }
  return catalogs;
}
