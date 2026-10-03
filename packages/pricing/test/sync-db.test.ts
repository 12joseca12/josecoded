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

  it('generates one update per pack by code and one upsert per extra', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql.startsWith('-- GENERATED')).toBe(true);
    for (const code of ['P1', 'P2', 'P3', 'P4']) expect(sql).toContain(`where code = '${code}';`);
    expect(sql.match(/update public\.pack_templates/g)).toHaveLength(4);
    expect(sql.match(/insert into public\.pack_extras/g)).toHaveLength(6);
    expect(sql).toContain('on conflict (code) do update');
    // apply_migration already wraps the file in a transaction
    expect(sql).not.toMatch(/^\s*(begin|commit);/im);
  });

  it('raises when a pack row is missing instead of passing silently', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql.match(/do \$sync\$/g)).toHaveLength(4);
    expect(sql.match(/if not found then/g)).toHaveLength(4);
    expect(sql).toContain("raise exception 'pack_templates has no row with code %', 'P1'");
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
    expect(bad((p) => (p.extras[0]!.description.es = 'x $sync$ y'))).toThrow(/dollar-quote/);
    expect(bad((p) => (p.version = "2026-09-14'; drop table leads; --"))).toThrow(
      /invalid version/,
    );
  });

  it('carries the prices and weeks of pricing.json', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql).toContain('price = 1400');
    expect(sql).toContain('weeks = 2');
    expect(sql).toContain("'maintenance_basic', 'Mantenimiento básico'");
  });

  it('escapes single quotes', () => {
    const tricky = finalSpanish();
    tricky.packs[0]!.name.es = "Web d'empresa";
    expect(buildSyncSql(tricky)).toContain("'Web d''empresa'");
  });

  it('needs no credentials and writes nothing to a database', () => {
    const sql = buildSyncSql(finalSpanish());
    expect(sql).not.toMatch(/service_role|SUPABASE|apikey/i);
  });
});
