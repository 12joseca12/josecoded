import { pathnames } from '@/i18n/pathnames';

import type { Href } from '@josecoded/types';

/** Internal means a path of this site (`/servicios`, `/servicios#packs`); `//host` is external. */
export function isInternalHref(href: Href): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/** What next-intl's `Link` takes for a localized internal route. */
export interface LinkTarget {
  pathname: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  hash?: string;
}

const templates = Object.keys(pathnames).map((key) => ({
  key,
  isDynamic: key.includes('['),
  // `/proyectos/[slug]` -> /^\/proyectos\/([^/]+)$/ and the list of param names
  names: [...key.matchAll(/\[(\w+)\]/g)].map((m) => m[1] ?? ''),
  pattern: new RegExp(`^${key.replace(/[.*+?^${}()|\\]/g, '\\$&').replace(/\[\w+\]/g, '([^/]+)')}$`),
}));

/**
 * Turns a Spanish canonical internal href into the object next-intl needs to localize it.
 * A string href with `?query` or `#hash`, or a dynamic one (`/proyectos/hazmefila`), is not found in
 * the `pathnames` map by next-intl and would keep the Spanish slug under `/en`, which then 301s; the
 * object form is localized per language.
 */
export function toLinkTarget(href: Href): LinkTarget {
  const url = new URL(href, 'https://local.invalid');
  const path = url.pathname;
  const query = Object.fromEntries(url.searchParams);
  const target: LinkTarget = { pathname: path };
  if (Object.keys(query).length > 0) target.query = query;
  if (url.hash !== '') target.hash = url.hash.slice(1);

  if (!templates.some((t) => t.key === path)) {
    for (const t of templates) {
      if (!t.isDynamic) continue;
      const match = t.pattern.exec(path);
      if (!match) continue;
      target.pathname = t.key;
      target.params = Object.fromEntries(t.names.map((name, i) => [name, match[i + 1] ?? '']));
      break;
    }
  }
  return target;
}
