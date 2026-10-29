// Generates supabase/generated/pricing-sync.sql from pricing.json (DT §0b, finding 11).
// It never connects to anything and needs no service role key: the controller reviews the file
// and applies it with apply_migration in task 9.4 (production gate, Jose's OK in session).
// Runs with plain Node (type stripping, Node >= 22.18). @josecoded/types is TypeScript source whose
// internal imports carry explicit `.ts` extensions precisely so Node can load it here.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { pricingSchema } from '@josecoded/types';

import type { PricingData } from '@josecoded/types';

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

const CODE_RE = /^[A-Za-z0-9_]+$/;

function assertCode(value: string, what: string) {
  if (!CODE_RE.test(value)) throw new Error(`sync-db: invalid ${what}: ${JSON.stringify(value)}`);
}

function assertPositiveInteger(value: number, what: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`sync-db: invalid ${what}: ${JSON.stringify(value)}`);
  }
}

function assertNoPendingTexts(pricing: PricingData) {
  const pendingPaths: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') {
      if (node.includes('{{DATO')) pendingPaths.push(path);
    } else if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`);
    }
  };
  // the Spanish texts are the reference ones: they must be final before a catalogue sync
  for (const pack of pricing.packs)
    walk({ name: pack.name.es, includes: pack.includes.es }, `packs.${pack.code}`);
  for (const extra of pricing.extras)
    walk({ label: extra.label.es, description: extra.description.es }, `extras.${extra.code}`);
  if (pendingPaths.length > 0) {
    throw new Error(
      `pricing.json has pending {{DATO}} texts, refusing to generate SQL: ${pendingPaths.join(', ')}`,
    );
  }
}

/**
 * Fixed mapping from pricing.json to the DATOS §4.2 schema. Slugs are not in pricing.json, so they live here
 * (same values as supabase/seed/seed.sql section 3). P5 is the mobile app: pricing.json lists it as `apps`
 * APP_MVP (the pack itself) and APP_PLUS (its `plus` option, D37).
 */
const PACK_SLUGS: Record<string, string> = {
  P1: 'landing',
  P2: 'gestion-logica',
  P3: 'crm-cms',
  P4: 'automatizaciones',
  P5: 'app',
};
const APP_PACK = { code: 'P5', baseApp: 'APP_MVP', optionApp: 'APP_PLUS', optionCode: 'plus' } as const;

interface PackRow {
  code: string;
  slug: string;
  price: number;
  weeks: number;
  sort: number;
}
interface OptionRow {
  packCode: string;
  code: string;
  price: number;
}

function catalogue(pricing: PricingData): { packs: PackRow[]; options: OptionRow[] } {
  const base = pricing.apps.find((a) => a.code === APP_PACK.baseApp);
  const plus = pricing.apps.find((a) => a.code === APP_PACK.optionApp);
  if (!base || !plus) {
    throw new Error(`sync-db: pricing.json needs apps ${APP_PACK.baseApp} and ${APP_PACK.optionApp}`);
  }
  const rows = [
    ...pricing.packs.map((p) => ({ code: p.code as string, price: p.price, weeks: p.weeks })),
    { code: APP_PACK.code as string, price: base.price, weeks: base.weeks },
  ];
  const packs = rows.map((row, i) => {
    const slug = PACK_SLUGS[row.code];
    if (!slug) throw new Error(`sync-db: no slug for pack ${row.code}`);
    return { ...row, slug, sort: i + 1 };
  });
  const options = [{ packCode: APP_PACK.code, code: APP_PACK.optionCode, price: plus.price }];
  return { packs, options };
}

/** Everything interpolated into SQL is validated first: numbers, codes and the version. */
function assertSafeToInterpolate(pricing: PricingData) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pricing.version)) {
    throw new Error(`sync-db: invalid version: ${JSON.stringify(pricing.version)}`);
  }
  for (const pack of pricing.packs) {
    assertCode(pack.code, 'pack code');
    assertPositiveInteger(pack.price, `price of ${pack.code}`);
    assertPositiveInteger(pack.weeks, `weeks of ${pack.code}`);
  }
  for (const app of pricing.apps) {
    assertCode(app.code, 'app code');
    assertPositiveInteger(app.price, `price of ${app.code}`);
    assertPositiveInteger(app.weeks, `weeks of ${app.code}`);
  }
  for (const extra of pricing.extras) {
    assertCode(extra.code, 'extra code');
    assertPositiveInteger(extra.price, `price of ${extra.code}`);
  }
}

/**
 * Idempotent upsert of the DATOS §4.2 catalogue (`public.packs`, `public.pack_options`, `public.extras`).
 * Names and descriptions live in messages/*.json, not in the database. It never deletes rows. One begin/commit
 * block so a failure leaves nothing half applied; no psql meta-commands, so it is a valid single batch for the
 * Management API `database/query` endpoint as well as for apply_migration or psql.
 */
export function buildSyncSql(pricing: PricingData): string {
  assertNoPendingTexts(pricing);
  assertSafeToInterpolate(pricing);
  const { packs, options } = catalogue(pricing);
  const v = quote(pricing.version);

  const packsSql = `insert into public.packs (code, slug, price, weeks, sort, active, pricing_version)\nvalues\n${packs
    .map((p) => `  (${quote(p.code)}, ${quote(p.slug)}, ${p.price}, ${p.weeks}, ${p.sort}, true, ${v})`)
    .join(',\n')}\non conflict (code) do update\n  set slug = excluded.slug,\n      price = excluded.price,\n      weeks = excluded.weeks,\n      sort = excluded.sort,\n      active = excluded.active,\n      pricing_version = excluded.pricing_version;`;

  const optionsSql = `insert into public.pack_options (pack_code, code, price, pricing_version)\nvalues\n${options
    .map((o) => `  (${quote(o.packCode)}, ${quote(o.code)}, ${o.price}, ${v})`)
    .join(',\n')}\non conflict (pack_code, code) do update\n  set price = excluded.price,\n      pricing_version = excluded.pricing_version;`;

  const extrasSql = `insert into public.extras (code, price, active, pricing_version)\nvalues\n${pricing.extras
    .map((e) => `  (${quote(e.code)}, ${e.price}, true, ${v})`)
    .join(',\n')}\non conflict (code) do update\n  set price = excluded.price,\n      active = excluded.active,\n      pricing_version = excluded.pricing_version;`;

  return [
    `-- GENERATED by packages/pricing/scripts/sync-db.ts from pricing.json (version ${pricing.version}).`,
    '-- Do not edit. Idempotent upsert, never deletes. Review, then apply at the production gate (Jose\'s OK).',
    'begin;',
    '',
    packsSql,
    '',
    optionsSql,
    '',
    extrasSql,
    '',
    'commit;',
    '',
  ].join('\n');
}

function main() {
  // the file is untrusted input for the SQL: validate it with the real schema first
  const pricing = pricingSchema.parse(
    JSON.parse(readFileSync(fileURLToPath(new URL('../pricing.json', import.meta.url)), 'utf8')),
  );
  const out = fileURLToPath(
    new URL('../../../supabase/generated/pricing-sync.sql', import.meta.url),
  );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildSyncSql(pricing));
  console.log(`wrote ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
