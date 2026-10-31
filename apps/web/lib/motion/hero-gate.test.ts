import { expect, it } from 'vitest';

import { decideHeroMode } from './hero-gate';

const desktop = { webgl2: true, desktop: true, reducedMotion: false, saveData: false, deviceMemory: 8 };

it.each([
  [desktop, 'scene'],
  [{ ...desktop, desktop: false }, 'video'],
  [{ ...desktop, webgl2: false }, 'video'],
  [{ ...desktop, deviceMemory: 2 }, 'video'],
  [{ ...desktop, saveData: true }, 'poster'],
  [{ ...desktop, reducedMotion: true }, 'poster'],
  [{ ...desktop, desktop: false, reducedMotion: true }, 'poster'],
])('%o -> %s', (ctx, mode) => {
  expect(decideHeroMode(ctx)).toBe(mode);
});
