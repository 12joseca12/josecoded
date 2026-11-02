import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ siteEnv: 'production' }));
vi.mock('@/lib/env', () => ({ env: { client: { get NEXT_PUBLIC_SITE_ENV() { return state.siteEnv; } } } }));

import { assertLegalPublishable, isLegalPublishable, isLegalPublishableEverywhere } from './publishable';

beforeEach(() => {
  state.siteEnv = 'production';
});

describe('legal publishable gate', () => {
  it('cookies has no marker, the other two still do, so in production they are not publishable', () => {
    expect(isLegalPublishable('cookies', 'es')).toBe(true);
    expect(isLegalPublishableEverywhere('aviso-legal')).toBe(false);
    expect(isLegalPublishable('privacidad', 'en')).toBe(false);
  });

  it('fails the production build while a text holds a {{DATO}}, and names the document', () => {
    expect(() => assertLegalPublishable('privacidad', 'es')).toThrow(/privacidad.*\{\{DATO\}\}/);
    expect(() => assertLegalPublishable('cookies', 'es')).not.toThrow();
  });

  it('lets a preview or local build render with the markers', () => {
    for (const env of ['preview', 'development']) {
      state.siteEnv = env;
      expect(() => assertLegalPublishable('aviso-legal', 'es')).not.toThrow();
    }
  });
});
