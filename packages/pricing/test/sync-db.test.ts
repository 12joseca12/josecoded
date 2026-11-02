import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  buildSeedSection,
  buildSyncSql,
  pendingTexts,
  replaceSeedSection,
  SEED_END,
  SEED_START,
  syncDb,
} from '../scripts/sync-db';
import { pricing } from '../src';

import type { PricingData } from '@josecoded/types';

const copy = (): PricingData => structuredClone(pricing);

describe('buildSyncSql (the one-time initial load)', () => {
  it('loads texts still marked {{DATO}} as they are, and lists them', () => {
    const withPending = copy();
    withPending.packs[0]!.name.es = '{{DATO: pack P1 name (es)}}';
    expect(pendingTexts(withPending)).toContain('P1.name.es');
    expect(buildSyncSql(withPending)).toContain('{{DATO: pack P1 name (es)}}');
  });

  it('upserts packs, pack_options, extras and settings with every column, in one transaction', () => {
    const sql = buildSyncSql(copy());
    expect(sql.startsWith('-- GENERATED')).toBe(true);
    expect(sql).toMatch(/^begin;$/m);
    expect(sql).toMatch(/^commit;$/m);
    expect(sql.match(/insert into public\.packs /g)).toHaveLength(1);
    expect(sql.match(/insert into public\.pack_options /g)).toHaveLength(1);
    expect(sql.match(/insert into public\.extras /g)).toHaveLength(1);
    expect(sql).toMatch(/\(code, kind, slug, name, includes, for_whom, price, weeks, sort, active, visible, pricing_version\)/);
    expect(sql).toMatch(/\(code, name, description, price, billing, sort, active, visible, pricing_version\)/);
    expect(sql.match(/on conflict \(code\) do update/g)).toHaveLength(2);
    expect(sql).toContain('on conflict (pack_code, code) do update');
    expect(sql).toMatch(/\('P5', 'app', 'app', '\{"es": "App MVP"[^\n]*, 4000, 6, 5, true, true, '2026-09-14'\)/);
    expect(sql).toMatch(/\('P5', 'plus', '\{"es": "App ampliada"[^\n]*, 6000, 8, /);
    expect(sql).toMatch(/\('maintenance_basic', [^\n]*, 49, 'monthly', 1, true, true, '2026-09-14'\)/);
    expect(sql).toContain('set hourly = 40, feature = 150');
    expect(sql).not.toMatch(/\bdelete\b|\btruncate\b|\bdrop\b|^\\/im);
  });

  it('starts with the published snapshot equal to the file (publication zero)', () => {
    const sql = buildSyncSql(copy());
    expect(sql).toContain('published_snapshot = private.pricing_snapshot_build()');
    expect(sql).toContain('published_hash = md5(private.pricing_snapshot_build()::text)');
  });

  it('references only the catalogue tables', () => {
    const sql = buildSyncSql(copy()).replace(/^--.*$/gm, '');
    const tables = [...sql.matchAll(/\b(?:into|from|update|join)\s+(public\.\w+)/gi)].map((m) => m[1]);
    expect(new Set(tables)).toEqual(
      new Set(['public.packs', 'public.pack_options', 'public.extras', 'public.pricing_settings']),
    );
  });

  it('validates what it interpolates', () => {
    const bad = (mutate: (p: PricingData) => void) => {
      const c = copy();
      mutate(c);
      return () => buildSyncSql(c);
    };
    expect(bad((p) => (p.packs[0]!.price = '0; drop table leads; --' as unknown as number))).toThrow(/invalid price of P1/);
    expect(bad((p) => (p.packs[1]!.price = 1400.5))).toThrow(/invalid price/);
    expect(bad((p) => (p.packs[1]!.weeks = 0))).toThrow(/invalid weeks/);
    expect(bad((p) => (p.packs[2]!.code = "P3'; drop table leads; --"))).toThrow(/invalid pack code/);
    expect(bad((p) => (p.extras[0]!.code = 'geo; x'))).toThrow(/invalid extra code/);
    expect(bad((p) => (p.extras[0]!.price = Number.NaN))).toThrow(/invalid price/);
    expect(bad((p) => (p.extras[0]!.billing = "one_off'; --" as 'one_off'))).toThrow(/invalid billing/);
    expect(bad((p) => (p.apps[1]!.price = 0))).toThrow(/invalid price of APP_PLUS/);
    expect(bad((p) => (p.hourly = 0))).toThrow(/invalid hourly/);
    expect(bad((p) => (p.version = "2026-09-14'; drop table leads; --"))).toThrow(/invalid version/);
  });

  it('quotes single quotes inside texts', () => {
    const c = copy();
    c.extras[0]!.label.es = "L'extra";
    expect(buildSyncSql(c)).toContain("L''extra");
  });

  it('is idempotent text: same input, same output; needs no credentials', () => {
    expect(buildSyncSql(copy())).toBe(buildSyncSql(copy()));
    expect(buildSyncSql(copy())).not.toMatch(/service_role|SUPABASE_|apikey/i);
  });
});

describe('seed section 3', () => {
  const seedText = readFileSync(new URL('../../../supabase/seed/seed.sql', import.meta.url), 'utf8');

  it('supabase/seed/seed.sql holds exactly what `pricing:sync-db --seed` generates', () => {
    const start = seedText.indexOf(SEED_START);
    const section = seedText.slice(start, seedText.indexOf(SEED_END, start));
    expect(section).toBe(buildSeedSection(pricing));
  });

  it('keeps the hidden pack fixture that the SQL tests need, with the visible flag off', () => {
    expect(buildSeedSection(pricing)).toMatch(/\('HIDDEN_PACK', 'web', 'hidden-pack', [^\n]*, 777, 1, 99, false, '2026-09-14'\)/);
  });

  it('replaces only section 3', () => {
    const replaced = replaceSeedSection('a\n-- 3) Price catalogue old\nx\n-- 4) next\nb\n', 'NEW\n');
    expect(replaced).toBe('a\nNEW\n-- 4) next\nb\n');
    expect(() => replaceSeedSection('nothing here', 'x')).toThrow(/section 3/);
  });
});

describe('syncDb: a one-time load', () => {
  it('refuses to run when the database already has price history', async () => {
    let applied = false;
    await expect(
      syncDb({
        countHistory: async () => 3,
        apply: async () => {
          applied = true;
        },
      }),
    ).rejects.toThrow('db_is_source');
    expect(applied).toBe(false);
  });

  it('applies the load while the database has no history of changes', async () => {
    const written: string[] = [];
    await syncDb({ countHistory: async () => 0, apply: async (sql) => void written.push(sql) });
    expect(written).toHaveLength(1);
    expect(written[0]).toMatch(/^begin;$/m);
  });

  it('does not swallow a failure to read the history', async () => {
    await expect(
      syncDb({
        countHistory: async () => {
          throw new Error('unreachable');
        },
        apply: async () => undefined,
      }),
    ).rejects.toThrow('unreachable');
  });
});
