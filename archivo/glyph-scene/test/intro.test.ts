import { expect, it } from 'vitest';

import { advanceIntro, createIntro, introActive, playIntro, skipIntro } from '../src/intro';

it('starts at 0 and finishes at 3 s', () => {
  const i = createIntro();
  expect(introActive(i)).toBe(false);
  playIntro(i, 1000);
  expect(i.t).toBe(0);
  advanceIntro(i, 0.5);
  expect(i.t).toBeCloseTo(0.5);
  advanceIntro(i, 2.6);
  expect(i.t).toBe(100);
});

it('follows the shared clock when given one and never goes negative', () => {
  const i = createIntro();
  playIntro(i, 1000);
  advanceIntro(i, 0.016, 900);
  expect(i.t).toBe(0);
  advanceIntro(i, 0.016, 2250);
  expect(i.t).toBeCloseTo(1.25);
  skipIntro(i);
  expect(i.t).toBe(100);
});
