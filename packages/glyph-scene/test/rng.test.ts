import { expect, it } from 'vitest';

import { mulberry32 } from '../src/rng';

it('is deterministic per seed and stays in [0, 1)', () => {
  const a = mulberry32(1);
  const b = mulberry32(1);
  const c = mulberry32(2);
  const sa = Array.from({ length: 50 }, a);
  expect(sa).toEqual(Array.from({ length: 50 }, b));
  expect(sa).not.toEqual(Array.from({ length: 50 }, c));
  for (const v of sa) {
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});

it('matches the reference mulberry32 sequence for seed 1', () => {
  const r = mulberry32(1);
  expect([r(), r(), r()]).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
});
