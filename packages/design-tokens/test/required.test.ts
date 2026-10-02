import { readFileSync } from 'node:fs';

import { expect, it } from 'vitest';

import { emitTokens } from '../src/emit.ts';

const design: unknown = JSON.parse(
  readFileSync(new URL('../../../.impeccable/design.json', import.meta.url), 'utf8'),
);
const required: string[] = JSON.parse(
  readFileSync(new URL('../required-tokens.json', import.meta.url), 'utf8'),
);

it('every required token exists in design.json and is emitted', () => {
  const { css } = emitTokens(design);
  const missing = required.filter((token) => !css.includes(`--${token}:`));
  expect(missing).toEqual([]);
});

it('has no duplicated names in the required list', () => {
  expect(new Set(required).size).toBe(required.length);
});

it('breakpoints are in rem and the pill radius is 9999rem', () => {
  const { css } = emitTokens(design);
  expect(css).toMatch(/--bp-menu: 67\.5rem/);
  expect(css).not.toMatch(/--bp-[a-z-]+: \d+px/);
  expect(css).not.toMatch(/--cq-[a-z0-9-]+: [\d.]+px/);
  expect(css).toMatch(/--r-pill: 9999rem/);
});

it('values come 1:1 from the home-v6 prototype', () => {
  const { css } = emitTokens(design);
  for (const line of [
    '--violet: #7c6cff;',
    '--card: rgb(22 19 48 / 0.84);',
    '--ease-out: cubic-bezier(0.23, 1, 0.32, 1);',
    '--ease-slide: cubic-bezier(0.77, 0, 0.175, 1);',
    '--ease-vt: cubic-bezier(0.32, 0.72, 0, 1);',
    '--dur-vt: 380ms;',
    '--dur-float: 6s;',
    '--glide-min: 600ms;',
    '--glide-max: 950ms;',
    '--wheel-threshold: 24;',
    '--wheel-lock: 700ms;',
    '--blur-beam: 5vmax;',
    '--z-open: 40;',
    '--cq-bento-12: 52rem;',
    '--light-cell-hero: 26rem;',
    '--font-display-size: clamp(3rem, 6.4vw, 5.75rem);',
    '--font-display-leading: 0.96;',
    '--font-display-tracking: -0.045em;',
    '--tint-hover: rgb(124 108 255 / 0.16);',
    '--scrim: rgb(7 6 15 / 0.72);',
  ]) {
    expect(css, line).toContain(line);
  }
});
