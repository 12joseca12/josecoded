import type { ContactListQuery } from '@josecoded/types';

/** Path of the inbox (Spanish only: /crm has no English slug). */
export const CONTACTS_PATH = '/crm/contactos';

type Patch = { [K in keyof ContactListQuery]?: ContactListQuery[K] | null };

/**
 * The URL of the inbox for a set of filters, with `patch` applied on top (`null` removes a filter). Any change of
 * filter starts again at the first page; only `page` itself in the patch moves it.
 */
export function contactsHref(query: ContactListQuery, patch: Patch = {}): string {
  const next: ContactListQuery = { ...query, ...(('page' in patch ? {} : { page: undefined }) as Patch) } as ContactListQuery;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) delete (next as Record<string, unknown>)[key];
    else (next as Record<string, unknown>)[key] = value;
  }
  const params = new URLSearchParams();
  if (next.kind) params.set('kind', next.kind);
  if (next.status) params.set('status', next.status);
  if (next.due) params.set('due', '1');
  if (next.q) params.set('q', next.q);
  if (next.owner) params.set('owner', next.owner);
  if (next.page && next.page > 1) params.set('page', String(next.page));
  const search = params.toString();
  return search ? `${CONTACTS_PATH}?${search}` : CONTACTS_PATH;
}

/** Whether any filter is on (the «quitar filtros» link and the empty state depend on it). */
export function hasFilters(query: ContactListQuery): boolean {
  return Boolean(query.kind || query.status || query.due || query.q || query.owner);
}
