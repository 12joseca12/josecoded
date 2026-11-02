// Loads the published catalogue (content/pricing.json) into Supabase ONCE (D54, plan 3.1c): after that the database is the
// source and the admin edits it (D2 «Precios»), so this script REFUSES to run once the database holds price changes.
//   pnpm pricing:sync-db          -> supabase/generated/pricing-sync.sql for the production gate (1.9c); the controller
//                                    reviews it and applies it with Jose's OK. Needs SUPABASE_URL and SUPABASE_SECRET_KEY
//                                    to read the history (read only); without them it refuses (it cannot prove it is the first load).
//   pnpm pricing:sync-db --seed   -> rewrites section 3 of supabase/seed/seed.sql (local data, no database needed).
// It never connects to anything to write. Runs with plain Node (type stripping, Node >= 22.18); @josecoded/types is
// TypeScript source whose internal imports carry explicit `.ts` extensions precisely so Node can load it here.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { pricingSchema } from '@josecoded/types';

import type { PricingData } from '@josecoded/types';

const PUBLISHED = new URL('../../../content/pricing.json', import.meta.url);
const SEED = new URL('../../../supabase/seed/seed.sql', import.meta.url);
const GENERATED = new URL('../../../supabase/generated/pricing-sync.sql', import.meta.url);

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
/** Postgres' own jsonb text (`{"es": "x", "en": "y"}`), so the generated seed reads like what `psql` prints. */
function pgJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(pgJson).join(', ')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${pgJson(v)}`).join(', ')}}`;
  }
  return JSON.stringify(value);
}
const jsonb = (value: unknown) => `${quote(pgJson(value))}::jsonb`;

const CODE_RE = /^[A-Za-z0-9_]+$/;
const VERSION_RE = /^\d{4}-\d{2}-\d{2}(\.\d+)?$/;

function assertCode(value: string, what: string) {
  if (!CODE_RE.test(value)) throw new Error(`sync-db: invalid ${what}: ${JSON.stringify(value)}`);
}

function assertPositiveInteger(value: number, what: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`sync-db: invalid ${what}: ${JSON.stringify(value)}`);
  }
}

/** Texts still marked `{{DATO: …}}`: loaded as they are (the admin fills them in D2), but listed so nobody is surprised. */
export function pendingTexts(pricing: PricingData): string[] {
  const found: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') {
      if (node.includes('{{DATO')) found.push(path);
    } else if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`);
    }
  };
  for (const pack of [...pricing.packs, ...pricing.apps]) walk(pack, pack.code);
  for (const extra of pricing.extras) walk(extra, extra.code);
  return found;
}

/**
 * Fixed mapping from the file to the DATOS §4.2 / §14.12.3 schema. Slugs are not in the file, so they live here (same
 * values as supabase/seed/seed.sql). P5 is the mobile app: the file lists it as `apps` APP_MVP (the pack itself) and
 * APP_PLUS (its `plus` option, D37).
 */
const PACK_SLUGS: Record<string, string> = {
  P1: 'landing',
  P2: 'gestion-logica',
  P3: 'crm-cms',
  P4: 'automatizaciones',
  P5: 'app',
};
const APP_PACK = { code: 'P5', baseApp: 'APP_MVP', optionApp: 'APP_PLUS', optionCode: 'plus' } as const;

/** Exists only in the local seed, to prove that a hidden pack never reaches the snapshot (supabase/test/pg). */
const HIDDEN_PACK_FIXTURE =
  `('HIDDEN_PACK', 'web', 'hidden-pack', ${jsonb({ es: 'Pack oculto', en: 'Hidden pack' })}, ` +
  `${jsonb({ es: ['Interno'], en: ['Internal'] })}, ${jsonb({ es: 'Solo pruebas', en: 'Tests only' })}, 777, 1, 99, false, `;

interface PackRow {
  code: string;
  kind: 'web' | 'app';
  slug: string;
  name: unknown;
  includes: unknown;
  forWhom: unknown;
  price: number;
  weeks: number;
  sort: number;
  active: boolean;
}
interface OptionRow {
  packCode: string;
  code: string;
  name: unknown;
  price: number;
  weeks: number;
  includes: unknown;
  forWhom: unknown;
}
interface ExtraRow {
  code: string;
  name: unknown;
  description: unknown;
  price: number;
  billing: string;
  sort: number;
  active: boolean;
}

const nullable = (value: unknown) => (value === undefined || value === null ? 'null' : jsonb(value));

function catalogue(pricing: PricingData): { packs: PackRow[]; options: OptionRow[]; extras: ExtraRow[] } {
  const base = pricing.apps.find((a) => a.code === APP_PACK.baseApp);
  const plus = pricing.apps.find((a) => a.code === APP_PACK.optionApp);
  if (!base || !plus) {
    throw new Error(`sync-db: the file needs apps ${APP_PACK.baseApp} and ${APP_PACK.optionApp}`);
  }
  const offers = [
    ...pricing.packs.map((p) => ({ ...p, code: p.code as string, kind: 'web' as const })),
    { ...base, code: APP_PACK.code as string, kind: 'app' as const },
  ];
  const packs = offers.map((offer, i): PackRow => {
    const slug = PACK_SLUGS[offer.code];
    if (!slug) throw new Error(`sync-db: no slug for pack ${offer.code}`);
    return {
      code: offer.code,
      kind: offer.kind,
      slug,
      name: offer.name,
      includes: offer.includes,
      forWhom: offer.forWhom,
      price: offer.price,
      weeks: offer.weeks,
      sort: i + 1,
      active: offer.active ?? true,
    };
  });
  const options: OptionRow[] = [
    {
      packCode: APP_PACK.code,
      code: APP_PACK.optionCode,
      name: plus.name,
      price: plus.price,
      weeks: plus.weeks,
      includes: plus.includes,
      forWhom: plus.forWhom,
    },
  ];
  const extras = pricing.extras.map(
    (e, i): ExtraRow => ({
      code: e.code,
      name: e.label,
      description: e.description,
      price: e.price,
      billing: e.billing,
      sort: i + 1,
      active: e.active ?? true,
    }),
  );
  return { packs, options, extras };
}

/** Everything interpolated into SQL is validated first: numbers, codes, billing and the version. */
function assertSafeToInterpolate(pricing: PricingData) {
  if (!VERSION_RE.test(pricing.version)) {
    throw new Error(`sync-db: invalid version: ${JSON.stringify(pricing.version)}`);
  }
  assertPositiveInteger(pricing.hourly, 'hourly');
  assertPositiveInteger(pricing.feature, 'feature');
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
    if (!['one_off', 'monthly', 'yearly'].includes(extra.billing)) {
      throw new Error(`sync-db: invalid billing of ${extra.code}: ${JSON.stringify(extra.billing)}`);
    }
  }
}

/**
 * The initial load, as one begin/commit block (a valid single batch for apply_migration, psql or the Management API):
 * an upsert of packs, options, extras and settings with every column of §14.12.3, and the «publication zero» (the
 * published snapshot is what the file says, so `pricing_published()` has a value from the first day). It never deletes.
 */
export function buildSyncSql(pricing: PricingData): string {
  assertSafeToInterpolate(pricing);
  const { packs, options, extras } = catalogue(pricing);
  const v = quote(pricing.version);

  const packsSql = `insert into public.packs (code, kind, slug, name, includes, for_whom, price, weeks, sort, active, visible, pricing_version)\nvalues\n${packs
    .map(
      (p) =>
        `  (${quote(p.code)}, ${quote(p.kind)}, ${quote(p.slug)}, ${jsonb(p.name)}, ${jsonb(p.includes)}, ${nullable(p.forWhom)}, ${p.price}, ${p.weeks}, ${p.sort}, ${p.active}, true, ${v})`,
    )
    .join(',\n')}\non conflict (code) do update\n  set kind = excluded.kind,\n      slug = excluded.slug,\n      name = excluded.name,\n      includes = excluded.includes,\n      for_whom = excluded.for_whom,\n      price = excluded.price,\n      weeks = excluded.weeks,\n      sort = excluded.sort,\n      active = excluded.active,\n      visible = excluded.visible,\n      pricing_version = excluded.pricing_version;`;

  const optionsSql = `insert into public.pack_options (pack_code, code, name, price, weeks, includes, for_whom, visible, pricing_version)\nvalues\n${options
    .map(
      (o) =>
        `  (${quote(o.packCode)}, ${quote(o.code)}, ${jsonb(o.name)}, ${o.price}, ${o.weeks}, ${jsonb(o.includes)}, ${nullable(o.forWhom)}, true, ${v})`,
    )
    .join(',\n')}\non conflict (pack_code, code) do update\n  set name = excluded.name,\n      price = excluded.price,\n      weeks = excluded.weeks,\n      includes = excluded.includes,\n      for_whom = excluded.for_whom,\n      visible = excluded.visible,\n      pricing_version = excluded.pricing_version;`;

  const extrasSql = `insert into public.extras (code, name, description, price, billing, sort, active, visible, pricing_version)\nvalues\n${extras
    .map(
      (e) =>
        `  (${quote(e.code)}, ${jsonb(e.name)}, ${nullable(e.description)}, ${e.price}, ${quote(e.billing)}, ${e.sort}, ${e.active}, true, ${v})`,
    )
    .join(',\n')}\non conflict (code) do update\n  set name = excluded.name,\n      description = excluded.description,\n      price = excluded.price,\n      billing = excluded.billing,\n      sort = excluded.sort,\n      active = excluded.active,\n      visible = excluded.visible,\n      pricing_version = excluded.pricing_version;`;

  const settingsSql = `update public.pricing_settings\n   set hourly = ${pricing.hourly}, feature = ${pricing.feature}, affiliate = ${jsonb(pricing.affiliate)},\n       pricing_version = ${v}, published_snapshot = private.pricing_snapshot_build(),\n       published_hash = md5(private.pricing_snapshot_build()::text), published_at = now();`;

  return [
    `-- GENERATED by packages/pricing/scripts/sync-db.ts from content/pricing.json (version ${pricing.version}).`,
    "-- Do not edit. ONE-TIME initial load of the catalogue (D54): afterwards the database is the source (D2). Idempotent upsert, never deletes.",
    "-- Review, then apply at the production gate (Jose's OK).",
    'begin;',
    '',
    packsSql,
    '',
    optionsSql,
    '',
    extrasSql,
    '',
    settingsSql,
    '',
    'commit;',
    '',
  ].join('\n');
}

/** Section 3 of supabase/seed/seed.sql, from the first marker up to (not including) `-- 4)`. */
export const SEED_START = '-- 3) Price catalogue';
export const SEED_END = '-- 4)';

export function buildSeedSection(pricing: PricingData): string {
  assertSafeToInterpolate(pricing);
  const { packs, options, extras } = catalogue(pricing);
  const v = quote(pricing.version);
  const lines = [
    `${SEED_START} with the values of content/pricing.json (version ${pricing.version}), names and texts included`,
    '--    (the form of `pnpm pricing:sync-db --seed`). P5 is the mobile app (the file lists it as APP_MVP / APP_PLUS: option plus',
    '--    of P5, D37). HIDDEN_PACK is not in the file: it exists to prove that a hidden pack never reaches the snapshot.',
    '--    The published snapshot is set at the end so the catalogue starts «published» (pricing_published() has a value).',
    'insert into public.packs (code, kind, slug, name, includes, for_whom, price, weeks, sort, visible, pricing_version) values',
    [
      ...packs.map(
        (p) =>
          `  (${quote(p.code)}, ${quote(p.kind)}, ${quote(p.slug)}, ${jsonb(p.name)}, ${jsonb(p.includes)}, ${nullable(p.forWhom)}, ${p.price}, ${p.weeks}, ${p.sort}, true, ${v})`,
      ),
      `  ${HIDDEN_PACK_FIXTURE}${v})`,
    ].join(',\n'),
    'on conflict (code) do nothing;',
    '',
    'insert into public.pack_options (pack_code, code, name, price, weeks, includes, for_whom, pricing_version) values',
    options
      .map(
        (o) =>
          `  (${quote(o.packCode)}, ${quote(o.code)}, ${jsonb(o.name)}, ${o.price}, ${o.weeks}, ${jsonb(o.includes)}, ${nullable(o.forWhom)}, ${v})`,
      )
      .join(',\n'),
    'on conflict (pack_code, code) do nothing;',
    '',
    'insert into public.extras (code, name, description, price, billing, sort, pricing_version) values',
    extras
      .map(
        (e) =>
          `  (${quote(e.code)}, ${jsonb(e.name)}, ${nullable(e.description)}, ${e.price}, ${quote(e.billing)}, ${e.sort}, ${v})`,
      )
      .join(',\n'),
    'on conflict (code) do nothing;',
    '',
    'update public.pricing_settings',
    `   set pricing_version = ${v}, published_snapshot = private.pricing_snapshot_build(),`,
    '       published_hash = md5(private.pricing_snapshot_build()::text), published_at = now();',
    '',
    '',
  ];
  return lines.join('\n');
}

/** Replaces section 3 of a seed file; throws when the markers are missing. */
export function replaceSeedSection(seed: string, section: string): string {
  const start = seed.indexOf(SEED_START);
  const end = seed.indexOf(SEED_END, start);
  if (start < 0 || end < 0) throw new Error('sync-db: section 3 not found in seed.sql');
  return seed.slice(0, start) + section + seed.slice(end);
}

export interface SyncDeps {
  /**
   * Price changes already made in the database by a person (history rows with `old_price` or `changed_by`; the rows the
   * initial load itself writes have neither). More than zero: the database is the source.
   */
  countHistory(): Promise<number>;
  apply(sql: string): Promise<void>;
  /** Defaults to the published file. */
  pricing?: PricingData;
}

/** The guarded entry point: refuses once the database has price history (the file is no longer the source). */
export async function syncDb(deps: SyncDeps): Promise<void> {
  if ((await deps.countHistory()) > 0) {
    throw new Error('db_is_source: la base ya es la fuente: usa D2 (admin > Contenido > Precios)');
  }
  await deps.apply(buildSyncSql(deps.pricing ?? readPublished()));
}

function readPublished(): PricingData {
  // the file is untrusted input for the SQL: validate it with the real schema first
  return pricingSchema.parse(JSON.parse(readFileSync(PUBLISHED, 'utf8')));
}

/** Read-only probe of `pricing_price_history` through PostgREST with the secret key of the project to load. */
async function countHistoryFromEnv(): Promise<number> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error('sync-db: set SUPABASE_URL and SUPABASE_SECRET_KEY to prove the database is empty of price history (or use --seed)');
  }
  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/pricing_price_history?select=item_code&or=(old_price.not.is.null,changed_by.not.is.null)&limit=1`,
    { headers: { apikey: key, authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`sync-db: could not read pricing_price_history (${res.status})`);
  const rows: unknown = await res.json();
  return Array.isArray(rows) ? rows.length : 1;
}

async function main() {
  const pricing = readPublished();
  const pending = pendingTexts(pricing);
  if (pending.length > 0) console.warn(`sync-db: ${pending.length} texts still marked {{DATO}} are loaded as they are`);

  if (process.argv.includes('--seed')) {
    const seedPath = fileURLToPath(SEED);
    writeFileSync(seedPath, replaceSeedSection(readFileSync(seedPath, 'utf8'), buildSeedSection(pricing)));
    console.log(`wrote section 3 of ${seedPath}`);
    return;
  }
  const out = fileURLToPath(GENERATED);
  try {
    await syncDb({
      pricing,
      countHistory: countHistoryFromEnv,
      apply: async (sql) => {
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, sql);
        console.log(`wrote ${out}`);
      },
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'sync-db failed');
    process.exit(error instanceof Error && error.message.startsWith('db_is_source') ? 2 : 1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
