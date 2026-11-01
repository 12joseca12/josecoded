import type { PathnameKey } from './urls';

/**
 * Open Graph cards: file key -> message path of its title (`null` = the site name). `scripts/og.ts` writes
 * `public/og/<key>-<locale>.png` for each; `ogImageFor` picks the card of a page.
 */
export const OG_KEYS = {
  default: null,
  servicios: 'nav.services',
  partners: 'nav.partners',
  proyectos: 'nav.projects',
  'sobre-mi': 'nav.about',
  contacto: 'nav.contact',
  blog: 'nav.blog',
  lab: 'nav.lab',
} as const satisfies Record<string, string | null>;

export type OgKey = keyof typeof OG_KEYS;

const KEY_OF_PATH: Partial<Record<PathnameKey, OgKey>> = {
  '/servicios': 'servicios',
  '/partners': 'partners',
  '/proyectos': 'proyectos',
  '/sobre-mi': 'sobre-mi',
  '/contacto': 'contacto',
  '/blog': 'blog',
  '/lab': 'lab',
};

/** Public path of the card for a page and language; the default card for pages without their own. */
export function ogImageFor(locale: 'es' | 'en', pathname: PathnameKey): string {
  return `/og/${KEY_OF_PATH[pathname] ?? 'default'}-${locale}.png`;
}
