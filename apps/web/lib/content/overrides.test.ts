import { describe, expect, it } from 'vitest';

import { DEFAULT_SITE_SETTINGS, readSiteSettings } from './overrides';

describe('readSiteSettings', () => {
  it('an empty published file leaves everything on', () => {
    expect(readSiteSettings({})).toEqual(DEFAULT_SITE_SETTINGS);
    expect(readSiteSettings().prices.showPrices).toBe(true);
  });

  it('merges partial overrides over the defaults', () => {
    const s = readSiteSettings({ sections: { blog: false }, prices: { showPrices: false } });
    expect(s.sections).toEqual({ ...DEFAULT_SITE_SETTINGS.sections, blog: false });
    expect(s.prices.showPrices).toBe(false);
  });

  it('fails loudly on a malformed file', () => {
    expect(() => readSiteSettings({ sections: { blog: 'no' } })).toThrow();
  });
});
