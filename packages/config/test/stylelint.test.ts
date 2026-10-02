import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

import config from '../stylelint.config.mjs';

async function lint(code: string): Promise<string[]> {
  const result = await stylelint.lint({ code, config });
  return (result.results[0]?.warnings ?? []).map((w) => w.rule);
}

describe('stylelint: no literals outside tokens', () => {
  it('rejects color literals, px outside exceptions, !important and border', async () => {
    expect(await lint('.a { color: #fff; }')).toContain(
      'declaration-property-value-disallowed-list',
    );
    expect(await lint('.a { padding: 24px; }')).toContain('unit-disallowed-list');
    expect(await lint('.a { border: 1px solid red; }')).toContain('property-disallowed-list');
    expect(await lint('.a { color: red !important; }')).toContain('declaration-no-important');
  });

  it('accepts tokens and the px exceptions', async () => {
    expect(
      await lint(
        '.a { color: var(--text); padding: var(--pad-cell); box-shadow: inset 0 0 0 1px var(--line); filter: blur(6px); }',
      ),
    ).toEqual([]);
  });

  it('rejects color functions and rem/ms literals in token-only properties', async () => {
    expect(await lint('.a { background: oklch(13% 0.02 289); }')).toContain(
      'declaration-property-value-disallowed-list',
    );
    expect(await lint('.a { padding: 1.5rem; }')).toContain(
      'declaration-property-value-disallowed-list',
    );
    expect(await lint('.a { transition: opacity 150ms; }')).toContain(
      'declaration-property-value-disallowed-list',
    );
    expect(await lint('.a { font-family: Geist; }')).toContain(
      'declaration-property-value-disallowed-list',
    );
  });

  it.each([
    '.a { font-size: clamp(2rem, 5vw, 4rem); }',
    '.a { border-radius: calc(1rem * 2); }',
    '.a { font: 500 1rem/1 Geist; }',
    '.a { transition: opacity var(--dur-fast) ease; }',
    '.a { transition: opacity var(--dur-fast) cubic-bezier(0.23, 1, 0.32, 1); }',
    '.a { animation: slide var(--dur-slow) linear; }',
  ])('rejects hidden literals: %s', async (css) => {
    expect(await lint(css)).toContain('declaration-property-value-disallowed-list');
  });

  it.each([
    '.a { font-size: clamp(var(--fs-min), var(--fs-fluid), var(--fs-max)); }',
    '.a { font-size: var(--font-display-size); }',
    '.a { border-radius: calc(var(--r-card) * 2); }',
    '.a { font: var(--font-body); }',
    '.a { transition: opacity var(--dur-fast) var(--ease-out); }',
    '.a { animation: slide var(--dur-slow) var(--ease-linear); }',
    '.a { animation-name: ease-in-slide; }',
  ])('accepts the token equivalent: %s', async (css) => {
    expect(await lint(css)).toEqual([]);
  });

  it('accepts calc() over tokens and structural values', async () => {
    expect(
      await lint(
        '.a { padding: calc(var(--sp-2) * 2); margin: 0 auto; gap: 0; width: 100%; transition: opacity var(--dur-fast) var(--ease-out); }',
      ),
    ).toEqual([]);
  });

  it('rejects px in media queries (breakpoints go in rem) and deep selectors', async () => {
    expect(await lint('@media (min-width: 544px) { .a { color: var(--text); } }')).toContain(
      'unit-disallowed-list',
    );
    expect(await lint('.a .b .c { color: var(--text); }')).toContain(
      'selector-max-compound-selectors',
    );
  });
});
