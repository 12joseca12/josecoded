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

export { currentFor, isInside } from './current';
