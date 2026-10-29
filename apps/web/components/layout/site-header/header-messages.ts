/**
 * Namespaces the header's client islands read (`UserMenu` uses `footer.clientArea`). The provider
 * in `SiteHeader` replaces the messages of its subtree with only these, so every namespace an
 * island calls with `useTranslations` must be listed here; tests render through the same list
 * (`renderHeaderIntl`).
 */
export const HEADER_NAMESPACES = ['nav', 'footer'] as const;

export type HeaderNamespace = (typeof HEADER_NAMESPACES)[number];

/** The reduced message set the header ships to the browser. */
export function pickHeaderMessages<T extends Record<HeaderNamespace, unknown>>(
  messages: T,
): Pick<T, HeaderNamespace> {
  return Object.fromEntries(HEADER_NAMESPACES.map((name) => [name, messages[name]])) as Pick<T, HeaderNamespace>;
}
