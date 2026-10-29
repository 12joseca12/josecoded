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

// Golden values from ref/home-v6/scene.js run under Node with Math.random = mulberry32(1) (n = 500).
const GOLDEN = {
  phone: {
    head: [0.4444611072540283, 0.6809362173080444, 0.07999999821186066, 0.4315793812274933, -1.1083794832229614, 0.07999999821186066, 0.1210477277636528, 0.6318859457969666, 0.07999999821186066],
    tail: [0.44088834524154663, 0.41531938314437866, 0.07999999821186066],
  },
  web: {
    head: [-1.3956165313720703, 0.06367357075214386, 0.05000000074505806, 1.2521600723266602, -0.699999988079071, 0.05000000074505806, -0.7565253973007202, 0.06463760882616043, 0.05000000074505806],
    tail: [-1.600000023841858, 0.27408653497695923, -0.0038970825262367725],
  },
  chip: {
    head: [-1.2495039701461792, 0.5192420482635498, 0.07000000029802322, 0.6468245387077332, -0.6984905004501343, 0.07000000029802322, -1.4706501960754395, -0.50044846534729, 0.07000000029802322],
    tail: [-0.6950733065605164, -0.05617291107773781, 0.09702857583761215],
  },
} as const;

for (const name of ['phone', 'web', 'chip'] as const) {
  it(`${name} matches the v6 prototype golden values`, () => {
    const a = clouds[name](500, mulberry32(1));
    expect(Array.from(a.slice(0, 9))).toEqual(GOLDEN[name].head);
    expect(Array.from(a.slice(-3))).toEqual(GOLDEN[name].tail);
  });
}
