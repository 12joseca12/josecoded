import { projectBySlug, tourProjects } from '@/lib/content/projects';

import type { Href, Locale } from '@josecoded/types';

/**
 * The projects the home shows, in the order of the tour (Jose, 2026-10-31): 3cat, 3catinfo and this
 * site. HazmeFila and Oportunix are out everywhere. The list, the names, the kind, the art and the
 * sentences come from the project sheets in `content/projects/` (task 3.1): adding a sheet adds a
 * card. 3catinfo and josecoded.com never take the first place of the index (`rankProjects`), and the
 * tour keeps the order of the sheets' own `order`.
 */
export const HOME_PROJECTS = tourProjects().map((project) => ({
  slug: project.slug,
  name: project.name,
  kind: project.type,
  art: project.art,
}));

export type HomeProjectSlug = string;

/** The one sentence of a project in this language; a `{{DATO}}` marker while it is pending. */
export function projectLead(slug: HomeProjectSlug, locale: Locale): string {
  return projectBySlug(slug)?.texts[locale].oneLiner ?? '';
}

export function projectHref(slug: HomeProjectSlug): Href {
  return `/proyectos/${slug}`;
}

/** Glyph art of 2.6, versioned like the hero media so a regenerated file is never served stale. */
export function projectArt(art: 'phone' | 'web', version: string): string {
  return `/art/glyph-${art}.avif?v=${encodeURIComponent(version)}`;
}
