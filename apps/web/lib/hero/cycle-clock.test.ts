import { expect, it } from 'vitest';

import { barsAt } from './cycle-clock';

it('fills the first bar during the hold, keeps it full in the first half of the morph, then moves on', () => {
  expect(barsAt(0)).toEqual({ index: 0, fill: 0 });
  expect(barsAt(1.75).fill).toBeCloseTo(0.5, 5);
  expect(barsAt(4)).toEqual({ index: 0, fill: 1 }); // morph, before half
  expect(barsAt(3.5 + 1.6 * 0.6)).toEqual({ index: 1, fill: 1 }); // morph, past half
  expect(barsAt(5.1)).toEqual({ index: 1, fill: 0 });
});

it('loops every 15.3 s', () => {
  expect(barsAt(15.3 + 1.75).index).toBe(0);
  expect(barsAt(15.3 + 1.75).fill).toBeCloseTo(barsAt(1.75).fill, 9);
  const third = barsAt(10.2 + 2);
  expect(third.index).toBe(2);
  expect(third.fill).toBeCloseTo(2 / 3.5, 9);
});
