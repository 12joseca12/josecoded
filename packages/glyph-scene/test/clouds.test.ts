import { expect, it } from 'vitest';

import { cloudChipBrain, clouds } from '../src/clouds';
import { mulberry32 } from '../src/rng';

for (const name of ['phone', 'web', 'chip'] as const) {
  it(`${name} is deterministic and sized n*3 within bounds`, () => {
    const a = clouds[name](500, mulberry32(1));
    const b = clouds[name](500, mulberry32(1));
    const c = clouds[name](500, mulberry32(2));
    expect(a).toHaveLength(1500);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const v of a) expect(Math.abs(v)).toBeLessThanOrEqual(3);
  });
}

it('phone cloud is taller than wide', () => {
  const p = clouds.phone(2000, mulberry32(1));
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < p.length; i += 3) {
    maxX = Math.max(maxX, Math.abs(p[i] as number));
    maxY = Math.max(maxY, Math.abs(p[i + 1] as number));
  }
  expect(maxY).toBeGreaterThan(maxX);
});

it('chip meta marks trace particles and is returned, not stashed', () => {
  const { positions, meta } = cloudChipBrain(1000, mulberry32(1));
  expect(positions).toHaveLength(3000);
  expect(meta.kind).toHaveLength(1000);
  const traces = meta.kind.reduce((n, k) => n + k, 0);
  expect(traces).toBeGreaterThan(0);
  expect(cloudChipBrain(1000, mulberry32(1)).meta.param).toEqual(meta.param);
});
