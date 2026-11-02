import { navLabel } from '@/lib/content/nav';
import { getSectionAvailability } from '@/lib/content/sections';

import type { NavLabelKey } from '@/lib/content/nav';
import type { SectionAvailability } from '@/lib/content/sections';
import type { Href } from '@josecoded/types';

/** The sections of the main navigation, in the order of home-v7 (README §16.1). */
export type NavKey = 'about' | 'services' | 'projects' | NavLabelKey;

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

const keep = (item: NavItem, { lab, blog }: SectionAvailability) => (item.key === 'lab' ? lab : item.key === 'blog' ? blog : true);

/**
 * Header and menu: Sobre mí, Servicios, Proyectos and one Lab/Blog link named by `navLabel()` (home-v7 §6.3, D10:
 * `/lab` when both exist, the anchor `#lab-blog` on the home). With neither section there is no fourth link.
 */
export function getNavItems(availability: SectionAvailability = getSectionAvailability()): NavItem[] {
  const label = navLabel(availability);
  const main = ALL.filter((item) => item.key !== 'lab' && item.key !== 'blog');
  if (!label) return main;
  return [...main, { key: label, href: availability.lab ? '/lab' : '/blog', scene: 'lab-blog' }];
}

/** Footer: Lab and Blog as two links, each only while it has content (home-v7 §6.7). */
export function getFooterNavItems(availability: SectionAvailability = getSectionAvailability()): NavItem[] {
  return ALL.filter((item) => keep(item, availability));
}

export { currentFor, isInside } from './current';
