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

it('every emitted token is in the required list (inverse check)', () => {
  const { names } = emitTokens(design);
  const listed = new Set(required.map((token) => `--${token}`));
  expect(names.filter((name) => !listed.has(name))).toEqual([]);
  expect(required).toHaveLength(names.length);
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

/** Parses `--name: value;` lines and resolves var() references, so composed tokens compare 1:1. */
function resolved(css: string): Map<string, string> {
  const raw = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/^ {2}--([\w-]+): (.+);$/gm)) {
    if (name && value) raw.set(name, value);
  }
  const resolve = (value: string): string =>
    value.replace(/var\(--([\w-]+)\)/g, (_m, ref: string) =>
      resolve(raw.get(ref) ?? `MISSING:${ref}`),
    );
  return new Map([...raw].map(([name, value]) => [name, resolve(value)]));
}

it('values come 1:1 from the home-v6 prototype (var() resolved)', () => {
  const tokens = resolved(emitTokens(design).css);
  const expected: [string, string][] = [
    ['violet', '#7c6cff'],
    ['card', 'rgb(22 19 48 / 0.84)'],
    ['ease-out', 'cubic-bezier(0.23, 1, 0.32, 1)'],
    ['ease-slide', 'cubic-bezier(0.77, 0, 0.175, 1)'],
    ['ease-vt', 'cubic-bezier(0.32, 0.72, 0, 1)'],
    ['dur-vt', '380ms'],
    ['dur-float', '6s'],
    ['dur-hover', '150ms'],
    ['glide-min', '600ms'],
    ['glide-max', '950ms'],
    ['glide-rate', '0.15'],
    ['wheel-threshold', '24'],
    ['wheel-lock', '700ms'],
    ['blur-beam', '5vmax'],
    ['saturate-header', '1.2'],
    ['z-open', '40'],
    ['cq-bento-12', '52rem'],
    ['bp-short', '43.75rem'],
    ['light-cell-hero', '26rem'],
    ['focus-ring-width', '2px'],
    ['focus-ring-offset', '3px'],
    ['r-focus', '0.375rem'],
    ['font-emphasis-weight', '500'],
    ['font-display-size', 'clamp(3rem, 6.4vw, 5.75rem)'],
    ['font-display-compact-size', 'clamp(2.5rem, 11vw, 3.5rem)'],
    ['font-display-compact-leading', '0.96'],
    ['font-figure-pack-hero-tracking', '-0.035em'],
    ['font-brand-tracking', '-0.02em'],
    ['tint-hover', 'rgb(124 108 255 / 0.16)'],
    ['scrim', 'rgb(7 6 15 / 0.72)'],
    ['sp-1-5', '0.375rem'],
    ['sp-16', '4rem'],
    ['size-hit', '2.75rem'],
    [
      'shadow-card',
      'inset 0 0 0 1px rgb(157 140 255 / 0.18), inset 0 1px 0 rgb(185 173 255 / 0.07), 0 30px 60px -30px rgb(5 3 20 / 0.95)',
    ],
    [
      'shadow-overlay',
      'inset 0 0 0 1px rgb(157 140 255 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.07), 0 40px 80px -20px rgb(5 3 20 / 0.9)',
    ],
    ['shadow-kbd', 'inset 0 -1px 0 rgb(0 0 0 / 0.4), inset 0 0 0 1px rgb(157 140 255 / 0.12)'],
    [
      'shadow-keycap-down',
      'inset 0 1px 0 rgb(185 173 255 / 0.2), inset 0 -1px 0 rgb(5 3 20 / 0.7), 0 0 0 1px rgb(157 140 255 / 0.5), 0 4px 10px -6px rgb(5 3 20 / 0.9)',
    ],
    ['shadow-selected-row', 'inset 0 0 0 1px rgb(157 140 255 / 0.2)'],
    [
      'grad-cell-tint',
      'linear-gradient(160deg, rgb(124 108 255 / 0.14), rgb(22 19 48 / 0.84) 60%)',
    ],
    ['grad-cell-hero', 'linear-gradient(135deg, rgb(124 108 255 / 0.2), rgb(22 19 48 / 0.84) 55%)'],
  ];
  for (const [name, value] of expected) expect(tokens.get(name), name).toBe(value);
});

it('has no unresolved var() reference', () => {
  const css = emitTokens(design).css;
  const unresolved = [...resolved(css)].filter(([, value]) => value.includes('MISSING:'));
  expect(unresolved).toEqual([]);
});

it('uses none of the names retired by the 1.10 review', () => {
  const { names } = emitTokens(design);
  for (const old of [
    '--dur-scene',
    '--dur-fast',
    '--dur-arrow',
    '--dur-key',
    '--ease-key',
    '--edge-key-down',
    '--r-key',
    '--shadow-key',
    '--scrollbar',
    '--tint-cell-hero',
    '--bp-hero-stack',
    '--sp-xs',
    '--sp-2xl',
    '--font-mono-key-size',
    '--stagger-draw',
    '--delay-draw',
    '--sp-container',
  ]) {
    expect(names, old).not.toContain(old);
  }
});
