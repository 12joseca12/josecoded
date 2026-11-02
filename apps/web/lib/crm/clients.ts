import type { AccessState } from './contact-detail';
import type { ProjectPhase, StatusBadgeTone } from '@josecoded/types';

// K6, the clients of the portfolio, as data the screens draw. `staff_clients()` returns a closer her own clients and
// the admin all of them (the database decides, never this file); everything here is presentation: the filters of the
// URL, the state of the portal access and the steps of the project.

/** Path of the screen (Spanish only: /crm has no English slug). */
export const CLIENTS_PATH = '/crm/clientes';

export interface ClientRow {
  id: string;
  contactId: string;
  /** The person (`crm_contacts.display_name`). */
  name: string;
  /** Her business, when there is one. */
  organization: string | null;
  /** The email of the contact: the address the invitation goes to. */
  email: string | null;
  packCode: string;
  packOption: string | null;
  phase: ProjectPhase;
  access: AccessState;
  /** Admin only: a closer's rows carry no owner. */
  ownerId: string | null;
  /** Stories waiting for a decision. */
  storiesPending: number;
}

export type AccessFilter = 'none' | 'invited' | 'active';
export const ACCESS_FILTERS: readonly AccessFilter[] = ['none', 'invited', 'active'];

export interface ClientQuery {
  q: string | null;
  access: AccessFilter | null;
  /** Only the clients that have stories to decide. */
  stories: boolean;
}

const SEARCH_MAX = 80;

/** `?q`, `?access` and `?stories` of the URL: whatever is not a known value is dropped. */
export function parseClientQuery(raw: Record<string, string | string[] | undefined>): ClientQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const q = first(raw.q)?.trim().slice(0, SEARCH_MAX);
  const access = first(raw.access);
  return {
    q: q || null,
    access: (ACCESS_FILTERS as readonly string[]).includes(access ?? '') ? (access as AccessFilter) : null,
    stories: first(raw.stories) === '1',
  };
}

/** The URL of the screen for a query with `patch` applied on top (`null` removes a filter). */
export function clientsHref(query: ClientQuery, patch: Partial<ClientQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.access) params.set('access', next.access);
  if (next.stories) params.set('stories', '1');
  const search = params.toString();
  return search ? `${CLIENTS_PATH}?${search}` : CLIENTS_PATH;
}

/** The URL for what the filter form holds: the same rule as `clientsHref`, so the enhanced submit lands where the plain GET would. */
export function clientsHrefFromEntries(entries: Iterable<[string, unknown]>): string {
  const raw: Record<string, string> = {};
  for (const [key, value] of entries) if (typeof value === 'string') raw[key] = value;
  return clientsHref(parseClientQuery(raw));
}

export function hasClientFilters(query: ClientQuery): boolean {
  return Boolean(query.q || query.access || query.stories);
}

const plain = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

/** The rows that match the search (person or business), the access state and the stories toggle. */
export function filterClients(rows: readonly ClientRow[], query: ClientQuery): ClientRow[] {
  const needle = query.q ? plain(query.q) : null;
  return rows.filter(
    (row) =>
      (!needle || plain(`${row.name} ${row.organization ?? ''}`).includes(needle)) &&
      (!query.access || row.access.state === query.access) &&
      (!query.stories || row.storiesPending > 0),
  );
}

/** Tone of the badge of the portal access (the badge always carries the text too). */
export function accessTone(access: AccessState): StatusBadgeTone {
  return access.state === 'active' ? 'live' : access.state === 'invited' ? 'active' : 'muted';
}

/** The five steps of a project; `maintenance` comes after the last one. */
export const PHASE_STEPS = ['kickoff', 'design', 'build', 'review', 'delivered'] as const;
export type PhaseStepKey = (typeof PHASE_STEPS)[number];
export type PhaseStepState = 'done' | 'current' | 'todo';

/** Which steps are done, which one is the current and which are still to come. In maintenance everything is done. */
export function phaseSteps(phase: ProjectPhase): { key: PhaseStepKey; state: PhaseStepState }[] {
  const index = phase === 'maintenance' ? PHASE_STEPS.length : PHASE_STEPS.indexOf(phase);
  return PHASE_STEPS.map((key, position) => ({
    key,
    state: position < index ? 'done' : position === index ? 'current' : 'todo',
  }));
}

/** Steps reached, the current one included: the «3/5» of the mini bar. */
export function phaseFilled(phase: ProjectPhase): number {
  return phase === 'maintenance' ? PHASE_STEPS.length : PHASE_STEPS.indexOf(phase) + 1;
}
