import type { Href } from '@josecoded/types';

/**
 * The projects the home shows, in the order of the tour (Jose, 2026-10-31): 3cat, 3catinfo and this
 * site. 3catinfo is never first and neither is josecoded.com (UX v4.0 §4.1). HazmeFila and
 * Oportunix are out everywhere. This is the one seam between the scene and the project content:
 * when `content/projects/*` exists (task 3.1) the list, the names and the sentences come from it and
 * this module reads them; until then names and sentences come from `messages`
 * (`home.scenes.projects.items.<slug>`, the sentences still `{{DATO}}`).
 */
export const HOME_PROJECTS = [
  { slug: '3cat', kind: 'app', art: 'phone' },
  { slug: '3catinfo', kind: 'app', art: 'phone' },
  { slug: 'josecoded', kind: 'web', art: 'web' },
] as const;

export type HomeProjectSlug = (typeof HOME_PROJECTS)[number]['slug'];

export function projectHref(slug: HomeProjectSlug): Href {
  return `/proyectos/${slug}`;
}

/** Glyph art of 2.6, versioned like the hero media so a regenerated file is never served stale. */
export function projectArt(art: 'phone' | 'web', version: string): string {
  return `/art/glyph-${art}.avif?v=${encodeURIComponent(version)}`;
}
