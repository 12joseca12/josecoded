/** Supported UI locales. Spanish is the default and has no URL prefix. */
export type Locale = 'es' | 'en';

/**
 * Any link target a component can receive: internal path, hash, absolute URL, mail or phone.
 * Polymorphic components (`Button`, `Link`) discriminate on this by `href` (working-agreements §15).
 */
export type Href =
  `/${string}` | `#${string}` | `https://${string}` | `mailto:${string}` | `tel:${string}`;
