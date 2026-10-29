import { createHash } from 'node:crypto';

import { expect, it } from 'vitest';

import { CAPTURE, PARAMS, paramsHash } from '../src/params';
import { sha256Hex } from '../src/sha256';

it('has the v6 values', () => {
  expect(PARAMS.hold).toBe(3.5);
  expect(PARAMS.morph).toBe(1.6);
  expect(PARAMS.green).toBe(0);
  expect(PARAMS.mirror).toBe(0.35);
  expect([0, 0.22]).toContain(PARAMS.bloom);
  expect('directedMorph' in PARAMS).toBe(false);
});

it('hash is stable and 16 hex chars', () => {
  expect(paramsHash()).toMatch(/^[0-9a-f]{16}$/);
  expect(paramsHash()).toBe(paramsHash());
});

it('hash changes with capture parameters, three version and extra sources', () => {
  const base = paramsHash();
  expect(paramsHash({ capture: { ...CAPTURE, width: 721 } })).not.toBe(base);
  expect(paramsHash({ threeVersion: '0.180.0' })).not.toBe(base);
  expect(paramsHash({ sources: ['shader'] })).not.toBe(base);
  expect(paramsHash({ params: { ...PARAMS, size: 17 } })).not.toBe(base);
});

it('sha256 matches node:crypto', () => {
  for (const s of ['', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'ñ{}[]'.repeat(40)]) {
    expect(sha256Hex(s)).toBe(createHash('sha256').update(s).digest('hex'));
  }
});
