/** Supported UI locales. Spanish is the default and has no URL prefix. */
export type Locale = 'es' | 'en';

/**
 * Any link target a component can receive: internal path, hash, absolute URL, mail or phone.
 * `//host` (protocol-relative) is not meant to be valid, but TypeScript has no negated template
 * types, so `/${string}` still admits it: `isInternalHref` treats `//host` as external.
 * Internal (starts with a single `/`) versus external is decided at render time by `isInternalHref`
 * in `apps/web/lib/href.ts`: internal goes through the next-intl `Link`, the rest is a plain `<a>`.
 * Polymorphic components (`Button`, `Link`) discriminate on this by `href` (working-agreements §15).
 */
export type Href =
  `/${string}` | `#${string}` | `https://${string}` | `mailto:${string}` | `tel:${string}`;
