/** Supported UI locales. Spanish is the default and has no URL prefix. */
export type Locale = 'es' | 'en';

/**
 * Any link target a component can receive: internal path, hash, absolute URL, mail or phone.
 * `//host` (protocol-relative) is not meant to be valid, but TypeScript has no negated template
 * types, so `/${string}` still admits it: reject it where hrefs are validated (zod, task 2.2).
 * Task 2.2 splits this into internal (derived from the next-intl `pathnames`) and external.
 * Polymorphic components (`Button`, `Link`) discriminate on this by `href` (working-agreements §15).
 */
export type Href =
  | `/${string}`
  | `#${string}`
  | `https://${string}`
  | `mailto:${string}`
  | `tel:${string}`;
