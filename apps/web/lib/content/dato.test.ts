import { describe, expect, it } from 'vitest';

import { hasDato, isPendingDato } from './dato';

describe('hasDato', () => {
  it('is false for a pending {{DATO}} marker', () => {
    expect(hasDato('{{DATO: ciudad}}')).toBe(false);
    expect(hasDato('  {{DATO: ciudad}}')).toBe(false);
  });

  it('is false for an empty value', () => {
    expect(hasDato('')).toBe(false);
    expect(hasDato('   ')).toBe(false);
  });

  it('is true for real content, even if it mentions the marker later on', () => {
    expect(hasDato('Madrid')).toBe(true);
    expect(hasDato('Madrid {{DATO}}')).toBe(true);
  });
});

describe('isPendingDato', () => {
  it('finds the marker anywhere in the value (hrefs such as /blog/{{DATO-slug}})', () => {
    expect(isPendingDato('{{DATO: ciudad}}')).toBe(true);
    expect(isPendingDato('/blog/{{DATO-slug}}')).toBe(true);
    expect(isPendingDato('Madrid')).toBe(false);
  });
});
