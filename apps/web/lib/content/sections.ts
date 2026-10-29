import { contentIndexSchema } from '@josecoded/types';

import raw from '@/content/generated/content-index.json';

/**
 * Which optional sections of the public site exist. Lab needs two real demos and Blog three real
 * guides, otherwise the section vanishes everywhere at once: header, menu, ⌘K, footer and home
 * (pantallas v2.0, P9 and P22). The counts come from `content/generated/content-index.json`, written
 * at prebuild by scripts/content-index.ts; every consumer goes through this one function. Task 4.5
 * adds `navLabel()` next to it.
 */
export interface SectionAvailability {
  lab: boolean;
  blog: boolean;
}

export function getSectionAvailability(): SectionAvailability {
  const { labEnabled, blogEnabled } = contentIndexSchema.parse(raw);
  return { lab: labEnabled, blog: blogEnabled };
}
