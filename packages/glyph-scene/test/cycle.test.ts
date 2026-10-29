import { expect, it } from 'vitest';

import { advanceCycle, createCycle, cycleFill, cycleIndex } from '../src/cycle';

const P = { hold: 3.5, morph: 1.6 };

it('runs PHONE -> WEB -> CHIP -> PHONE with a 5.1 s period each', () => {
  const c = createCycle();
  const seen: number[] = [];
  for (let t = 0; t < 15.5; t += 0.05) {
    advanceCycle(c, 0.05, P, false);
    if (seen.at(-1) !== cycleIndex(c)) seen.push(cycleIndex(c));
  }
  expect(seen).toEqual([0, 1, 2, 0]);
  expect(c.state).toBe(0);
});

it('does not advance while waiting for the intro', () => {
  const c = createCycle();
  advanceCycle(c, 10, P, true);
  expect(c).toMatchObject({ phase: 'hold', pt: 0, prog: 0 });
});

it('fill grows during the hold and stays full during a morph', () => {
  const c = createCycle();
  advanceCycle(c, 1.75, P, false);
  expect(cycleFill(c, P.hold)).toBeCloseTo(0.5);
  advanceCycle(c, 1.75, P, false);
  expect(c.phase).toBe('morph');
  expect(cycleFill(c, P.hold)).toBe(1);
});
