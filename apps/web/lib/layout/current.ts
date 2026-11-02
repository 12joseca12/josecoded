// Kept apart from `nav.ts` on purpose: that module reads the content index (and so loads zod), which a client
// island must not drag into the initial JS of every page just to compare two paths.

/** True when `pathname` is `href` or lives below it (`/proyectos/3cat` is inside `/proyectos`). */
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
