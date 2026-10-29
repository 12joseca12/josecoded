import { createHash } from 'node:crypto';

import { expect, it } from 'vitest';

import { clouds } from '../src/clouds';
import { CAPTURE, COUNT, PARAMS, cloudsDigest, paramsHash, type Params } from '../src/params';
import { sha256Hex } from '../src/sha256';

it('has the v6 values', () => {
  expect(PARAMS.hold).toBe(3.5);
  expect(PARAMS.morph).toBe(1.6);
  expect(PARAMS.green).toBe(0);
  expect(PARAMS.mirror).toBe(0.35);
  expect(PARAMS.bloom).toBe(0.22);
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

it('Params accepts partial overrides with plain numbers', () => {
  const over: Partial<Params> = { rot: 0 };
  expect(paramsHash({ params: { ...PARAMS, ...over } })).not.toBe(paramsHash());
});

it('clouds digest changes when a geometry detail changes at the capture counts', () => {
  const base = cloudsDigest(CAPTURE.seed);
  expect(cloudsDigest(CAPTURE.seed)).toBe(base);
  // Simulates the reviewer's repro: a tiny edit that moves only a few particles (e.g. one dot radius).
  const nudged = {
    ...clouds,
    chip: (n: number, rng: () => number) => {
      const a = clouds.chip(n, rng);
      const i = (COUNT.video - 1) * 3; // last particle of the video-sized cloud only
      a[i] = (a[i] as number) + 0.01;
      return a;
    },
  };
  expect(cloudsDigest(CAPTURE.seed, nudged)).not.toBe(base);
  const nudgedDesktop = {
    ...clouds,
    web: (n: number, rng: () => number) => {
      const a = clouds.web(n, rng);
      if (n === COUNT.desktop) a[(n - 1) * 3 + 1] = (a[(n - 1) * 3 + 1] as number) + 0.01;
      return a;
    },
  };
  expect(cloudsDigest(CAPTURE.seed, nudgedDesktop)).not.toBe(base);
});

it('sha256 matches node:crypto', () => {
  for (const s of ['', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'ñ{}[]'.repeat(40)]) {
    expect(sha256Hex(s)).toBe(createHash('sha256').update(s).digest('hex'));
  }
});
