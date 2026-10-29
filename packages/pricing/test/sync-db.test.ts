import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildSyncSql } from '../scripts/sync-db';
import { pricing } from '../src';

import type { PricingData } from '@josecoded/types';

/** A copy of pricing.json where every Spanish text is final (English may stay pending). */
function finalSpanish(): PricingData {
  const copy: PricingData = structuredClone(pricing);
  for (const pack of copy.packs) pack.forWhom.es = 'para quien';
  return copy;
}

describe('buildSyncSql', () => {
  it('refuses to generate while Spanish texts are pending', () => {
    const withPending = structuredClone(pricing);
    withPending.packs[0]!.name.es = '{{DATO: pack P1 name (es)}}';
    expect(() => buildSyncSql(withPending)).toThrow(/pending/);
  });

  it('upserts packs, pack_options and extras of the new schema, in one transaction', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql.startsWith('-- GENERATED')).toBe(true);
    expect(sql).toMatch(/^begin;$/m);
    expect(sql).toMatch(/^commit;$/m);
    expect(sql.match(/insert into public\.packs /g)).toHaveLength(1);
    expect(sql.match(/insert into public\.pack_options /g)).toHaveLength(1);
    expect(sql.match(/insert into public\.extras /g)).toHaveLength(1);
    expect(sql.match(/on conflict \(code\) do update/g)).toHaveLength(2);
    expect(sql).toContain('on conflict (pack_code, code) do update');
    expect(sql).toContain("('P5', 'app', 4000, 6, 5, true, '2026-09-14')");
    expect(sql).toContain("('P5', 'plus', 6000, '2026-09-14')");
    expect(sql).not.toMatch(/\bdelete\b|\btruncate\b|\bdrop\b|^\\/im);
  });

  it('references only packs, pack_options and extras', () => {
    const sql = buildSyncSql(finalSpanish()).replace(/^--.*$/gm, '');
    const tables = [...sql.matchAll(/\b(?:into|from|update|join)\s+(public\.\w+)/gi)].map((m) => m[1]);
    expect(new Set(tables)).toEqual(
      new Set(['public.packs', 'public.pack_options', 'public.extras']),
    );
    expect(sql).not.toMatch(/pack_templates|pack_extras|nombre|descripcion|precio/);
  });

  it('matches the catalogue section of supabase/seed/seed.sql', () => {
    const seed = readFileSync(new URL('../../../supabase/seed/seed.sql', import.meta.url), 'utf8');
    const section = seed.slice(seed.indexOf('-- 3) Price catalogue'), seed.indexOf('-- 4)'));
    const tuples = (text: string) =>
      [...text.matchAll(/\(\s*'([^']+)'\s*,([^()]*)\)/g)].map((m) =>
        `${m[1]},${m[2]!.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()}`.replace(/,true,/g, ','),
      );
    const sql = buildSyncSql(finalSpanish());
    const seedTuples = tuples(section.replace(/^\s*--.*$/gm, ''));
    const generated = tuples(sql.replace(/^--.*$/gm, ''));
    expect(generated.length).toBeGreaterThan(0);
    expect(generated).toEqual(seedTuples);
  });

  it('validates what it interpolates', () => {
    const bad = (mutate: (p: PricingData) => void) => {
      const copy = finalSpanish();
      mutate(copy);
      return () => buildSyncSql(copy);
    };
    expect(
      bad((p) => (p.packs[0]!.price = '0; drop table leads; --' as unknown as number)),
    ).toThrow(/invalid price of P1/);
    expect(bad((p) => (p.packs[1]!.price = 1400.5))).toThrow(/invalid price/);
    expect(bad((p) => (p.packs[1]!.weeks = 0))).toThrow(/invalid weeks/);
    expect(bad((p) => (p.packs[2]!.code = "P3'; drop table leads; --" as 'P3'))).toThrow(
      /invalid pack code/,
    );
    expect(bad((p) => (p.extras[0]!.code = 'geo; x' as 'geo'))).toThrow(/invalid extra code/);
    expect(bad((p) => (p.extras[0]!.price = Number.NaN))).toThrow(/invalid price/);
    expect(bad((p) => (p.apps[1]!.price = 0))).toThrow(/invalid price of APP_PLUS/);
    expect(bad((p) => (p.version = "2026-09-14'; drop table leads; --"))).toThrow(
      /invalid version/,
    );
  });

  it('carries the prices and weeks of pricing.json', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql).toContain("('P2', 'gestion-logica', 1400, 2, 2, true, '2026-09-14')");
    expect(sql).toContain("('maintenance_basic', 49, true, '2026-09-14')");
  });

  it('is idempotent text: same input, same output', () => {
    expect(buildSyncSql(finalSpanish())).toBe(buildSyncSql(finalSpanish()));
  });

  it('needs no credentials and writes nothing to a database', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql).not.toMatch(/service_role|SUPABASE|apikey/i);
  });
});
