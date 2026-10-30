import { contentIndexSchema, siteEnvSchema } from '@josecoded/types';

import raw from '@/content/generated/content-index.json';

import type { SiteEnv } from '@josecoded/types';

/**
 * Which optional sections of the public site exist. Lab needs two real demos and Blog three real
 * guides, otherwise the section vanishes everywhere at once: header, menu, ⌘K, footer and home
 * (pantallas v2.0, P9 and P22). The counts come from `content/generated/content-index.json`, written
 * at prebuild by scripts/content-index.ts; every consumer goes through this one function. Task 4.5
 * adds `navLabel()` next to it.
 *
 * Outside production (local dev, previews, CI e2e) both sections are always on, like the approved
 * home-v7 prototype (Jose, 2026-10-30). `NEXT_PUBLIC_SITE_ENV` is the single build-time signal; absent
 * means production.
 */
export interface SectionAvailability {
  lab: boolean;
  blog: boolean;
}

/** `index` is injectable for tests; production reads the generated file. */
export function getSectionAvailability(
  index: unknown = raw,
  // literal name so Next inlines it; read here (not via lib/env) to keep this module free of the full env parse
  siteEnv: SiteEnv = siteEnvSchema.parse(process.env.NEXT_PUBLIC_SITE_ENV || undefined),
): SectionAvailability {
  const { labEnabled, blogEnabled } = contentIndexSchema.parse(index);
  if (siteEnv !== 'production') return { lab: true, blog: true };
  return { lab: labEnabled, blog: blogEnabled };
}
