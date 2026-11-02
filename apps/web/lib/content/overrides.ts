import { z } from 'zod';

import { siteSettingsSchema } from '@josecoded/types';

import raw from '@/content/overrides/settings.json';

import type { SiteSettings } from '@josecoded/types';

// Published site settings (`content/overrides/settings.json`, committed by the GitHub App, D53). The file starts as
// `{}`: every missing key falls back to the default below, so an empty file leaves the site exactly as it is.
// A malformed file fails the build (the module is evaluated at build time), never silently.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  sections: { lab: true, blog: true, partners: true, projects: true, chat: true },
  prices: { showPrices: true },
  home: { scenes: [] },
};

const overrideSchema = z.object({
  sections: siteSettingsSchema.shape.sections.partial().optional(),
  prices: siteSettingsSchema.shape.prices.partial().optional(),
  home: siteSettingsSchema.shape.home.partial().optional(),
});

/** `input` is injectable for tests; production reads the published file. */
export function readSiteSettings(input: unknown = raw): SiteSettings {
  const o = overrideSchema.parse(input);
  return {
    sections: { ...DEFAULT_SITE_SETTINGS.sections, ...o.sections },
    prices: { ...DEFAULT_SITE_SETTINGS.prices, ...o.prices },
    home: { ...DEFAULT_SITE_SETTINGS.home, ...o.home },
  };
}
