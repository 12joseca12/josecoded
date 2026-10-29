// `pnpm --filter @josecoded/web i18n:check` (also `pnpm i18n:check` from the root).
// Compares messages/es/<screen>.json with messages/en/<screen>.json file by file and lists
// (1) every key whose value still carries a {{DATO}} marker and (2) the keys, and whole screen
// files, present in one locale and absent in the other. Exit code 1 only when something is
// missing: pending markers are listed, never fatal (working-agreements §10).
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isPendingDato } from '../lib/content/dato.ts';

export interface CheckResult {
  /** Keys with a {{DATO}} marker in either locale. */
  pendingDato: string[];
  missingInEs: string[];
  missingInEn: string[];
}

export type Catalogs = Record<string, Record<string, unknown>>;

export interface CatalogsReport {
  missingFilesInEs: string[];
  missingFilesInEn: string[];
  files: Record<string, CheckResult>;
}

function flatten(node: unknown, prefix: string, out: Map<string, string>): Map<string, string> {
  if (node !== null && typeof node === 'object') {
    for (const [key, child] of Object.entries(node)) {
      flatten(child, prefix === '' ? key : `${prefix}.${key}`, out);
    }
  } else {
    out.set(prefix, String(node));
  }
  return out;
}

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

export function checkMessages(
  es: Record<string, unknown>,
  en: Record<string, unknown>,
): CheckResult {
  const esKeys = flatten(es, '', new Map());
  const enKeys = flatten(en, '', new Map());
  const pending = [...esKeys, ...enKeys].filter(([, value]) => isPendingDato(value));
  return {
    pendingDato: sorted(pending.map(([key]) => key)),
    missingInEs: sorted([...enKeys.keys()].filter((key) => !esKeys.has(key))),
    missingInEn: sorted([...esKeys.keys()].filter((key) => !enKeys.has(key))),
  };
}

export function checkCatalogs(es: Catalogs, en: Catalogs): CatalogsReport {
  const files: Record<string, CheckResult> = {};
  for (const name of sorted(Object.keys(es))) {
    const other = en[name];
    const own = es[name];
    if (other && own) files[name] = checkMessages(own, other);
  }
  return {
    missingFilesInEs: sorted(Object.keys(en).filter((name) => !(name in es))),
    missingFilesInEn: sorted(Object.keys(es).filter((name) => !(name in en))),
    files,
  };
}

export function hasMissing(report: CatalogsReport): boolean {
  return (
    report.missingFilesInEs.length > 0 ||
    report.missingFilesInEn.length > 0 ||
    Object.values(report.files).some((r) => r.missingInEs.length > 0 || r.missingInEn.length > 0)
  );
}

export function formatReport(report: CatalogsReport): string {
  const lines: string[] = [];
  for (const name of report.missingFilesInEs) lines.push(`MISSING FILE  messages/es/${name}.json`);
  for (const name of report.missingFilesInEn) lines.push(`MISSING FILE  messages/en/${name}.json`);
  for (const [name, r] of Object.entries(report.files)) {
    for (const key of r.missingInEs) lines.push(`MISSING es     ${name}: ${key}`);
    for (const key of r.missingInEn) lines.push(`MISSING en     ${name}: ${key}`);
  }
  const pending = Object.entries(report.files).flatMap(([name, r]) =>
    r.pendingDato.map((key) => `${name}: ${key}`),
  );
  if (pending.length > 0) {
    lines.push('', `Pending {{DATO}} (${pending.length}), Jose must supply:`);
    for (const entry of pending) lines.push(`  ${entry}`);
  }
  return lines.join('\n');
}

export function loadCatalogs(locale: string, root = join(import.meta.dirname, '..', 'messages')) {
  const dir = join(root, locale);
  const catalogs: Catalogs = {};
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    catalogs[file.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  }
  return catalogs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = checkCatalogs(loadCatalogs('es'), loadCatalogs('en'));
  const text = formatReport(report);
  console.log(text === '' ? 'i18n: es and en are in sync, nothing pending.' : text);
  if (hasMissing(report)) {
    console.error('\ni18n:check failed: keys or files are missing in one locale.');
    process.exit(1);
  }
}
