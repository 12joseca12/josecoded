import { getSectionAvailability } from '@/lib/content/sections';

import type { SectionAvailability } from '@/lib/content/sections';
import type { Href } from '@josecoded/types';

/** The sections of the main navigation, in the order of home-v7 (README §16.1). */
export type NavKey = 'about' | 'services' | 'projects' | 'lab' | 'blog';

export interface NavItem {
  key: NavKey;
  /** Spanish canonical path; the localized `Link` translates it. */
  href: Href;
  /** Id of the home scene that stands for this destination (Lab and Blog share one scene). */
  scene: string;
}

const ALL: readonly NavItem[] = [
  { key: 'about', href: '/sobre-mi', scene: 'sobre-mi' },
  { key: 'services', href: '/servicios', scene: 'servicios' },
  { key: 'projects', href: '/proyectos', scene: 'proyectos' },
  { key: 'lab', href: '/lab', scene: 'lab-blog' },
  { key: 'blog', href: '/blog', scene: 'lab-blog' },
];

/** Header, menu and footer share this list; Lab and Blog drop out when they have no content. */
export function getNavItems(availability: SectionAvailability = getSectionAvailability()): NavItem[] {
  return ALL.filter((item) => (item.key === 'lab' ? availability.lab : item.key === 'blog' ? availability.blog : true));
}

/** True when `pathname` is `href` or lives below it (`/proyectos/hazmefila` is inside `/proyectos`). */
export function isInside(pathname: string | null, href: string): boolean {
  return pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
}

/**
 * `aria-current` of a link for the page being shown. The exact page is `page`; a page inside the
 * section (a project detail) marks its section with `true`. The home marks nothing: its scenes
 * are shown with `data-here` instead, because the page itself is still the home (README §16.1).
 */
export function currentFor(pathname: string | null, href: string): 'page' | 'true' | undefined {
  if (pathname === href) return 'page';
  return isInside(pathname, href) ? 'true' : undefined;
}
