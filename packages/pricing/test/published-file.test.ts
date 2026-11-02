import { readFileSync } from 'node:fs';

import { expect, it } from 'vitest';

import { pricingSchema } from '@josecoded/types';

import { pricing } from '../src';
import { stableStringify } from '../src/serialize';

const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

it('loads the published catalogue from content/pricing.json', () => {
  expect(pricing).toEqual(pricingSchema.parse(read('../../../content/pricing.json')));
});

it('the file is exactly what the serializer writes (a pull or a bot commit leaves no diff)', () => {
  const text = readFileSync(new URL('../../../content/pricing.json', import.meta.url), 'utf8');
  expect(stableStringify(JSON.parse(text))).toBe(text);
});

it('the seed snapshot has the same shape and values as the published file (except version)', () => {
  const snap = read('../../../supabase/test/fixtures/pricing-snapshot.json');
  expect({ ...pricingSchema.parse(snap), version: '' }).toEqual({ ...pricing, version: '' });
});

it('stableStringify is deterministic and ends with a newline', () => {
  expect(stableStringify({ b: 1, a: [2, 1] })).toBe('{\n  "a": [\n    2,\n    1\n  ],\n  "b": 1\n}\n');
  expect(stableStringify({ b: { z: 1, y: 2 }, a: 0 })).toBe(stableStringify({ a: 0, b: { y: 2, z: 1 } }));
});

it('the schema accepts what the admin can create: dynamic codes, dated versions, yearly billing, null descriptions', () => {
  const grown = structuredClone(pricing);
  grown.version = '2026-11-02.3';
  grown.packs.push({ ...grown.packs[0]!, code: 'LANDING', forWhom: null });
  grown.extras.push({ ...grown.extras[0]!, code: 'copywriting', billing: 'yearly', description: null, visible: true });
  expect(pricingSchema.parse(grown).packs.at(-1)?.code).toBe('LANDING');
});

it('the schema rejects bad versions, bad codes and duplicates', () => {
  const bad = (mutate: (p: typeof pricing) => void) => {
    const copy = structuredClone(pricing);
    mutate(copy);
    return pricingSchema.safeParse(copy).success;
  };
  expect(bad((p) => (p.version = '2026-11-02.'))).toBe(false);
  expect(bad((p) => (p.version = 'v2'))).toBe(false);
  expect(bad((p) => p.packs.push({ ...p.packs[0]!, code: 'p6' }))).toBe(false);
  expect(bad((p) => p.packs.push({ ...p.packs[0]! }))).toBe(false);
  expect(bad((p) => p.extras.push({ ...p.extras[0]!, code: 'Bad-Code' }))).toBe(false);
});
