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
    expect(sql).toMatch(/begin;[\s\S]*commit;/);
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
