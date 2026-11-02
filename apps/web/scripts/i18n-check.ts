// `pnpm --filter @josecoded/web i18n:check` (also `pnpm i18n:check` from the root).
// Compares messages/es/<screen>.json with messages/en/<screen>.json file by file and lists
// (1) every key whose value still carries a {{DATO}} marker and (2) the keys, and whole screen
// files, present in one locale and absent in the other. Exit code 1 only when something is
// missing: pending markers are listed, never fatal (working-agreements §10).
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { fileURLToPath } from 'node:url';


import { loadCatalogs } from './catalogs.ts';
import { composeCatalogs, mergeMessages, readOverrides } from './merge-overrides.ts';
import { isPendingDato } from '../lib/content/dato.ts';

import type { Catalogs } from './catalogs.ts';

export { loadCatalogs };
export type { Catalogs };


export interface CheckResult {
  /** Keys with a {{DATO}} marker in either locale. */
  pendingDato: string[];
  missingInEs: string[];
  missingInEn: string[];
}

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

/** Published overrides that the build would refuse (unknown key, namespace not editable, {{DATO}}, HTML), per locale. */
export function checkOverrides(locales: readonly string[] = ['es', 'en']): string[] {
  const problems: string[] = [];
  for (const locale of locales) {
    try {
      mergeMessages(composeCatalogs(locale), readOverrides(locale));
    } catch (error) {
      problems.push(`OVERRIDE ${locale}  ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = checkCatalogs(loadCatalogs('es'), loadCatalogs('en'));
  const text = formatReport(report);
  console.log(text === '' ? 'i18n: es and en are in sync, nothing pending.' : text);
  const overrideProblems = checkOverrides();
  for (const line of overrideProblems) console.error(line);
  if (overrideProblems.length > 0) {
    console.error('\ni18n:check failed: a published override would break the build.');
    process.exit(1);
  }
  if (hasMissing(report)) {
    console.error('\ni18n:check failed: keys or files are missing in one locale.');
    process.exit(1);
  }
}
