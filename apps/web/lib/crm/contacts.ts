import { contactListQuerySchema, CONTACTS_PAGE_SIZE } from '@josecoded/types';

import { getOptionalSession } from '@/lib/auth/guards';

import type { StaffRole } from '@/lib/auth/staff';
import type { ServerSupabase } from '@/lib/supabase/server';
import type { ContactKind, ContactListQuery, Tables } from '@josecoded/types';

// Reads of the contacts screens (K2 inbox, K3 detail). They run with the JWT of the person: RLS decides which
// contacts exist for them (a closer gets her portfolio, the admin everything). Nothing here filters by owner to
// protect data; the `owner` filter is a convenience of the admin, ignored for a closer, who also never receives an
// owner id or an owner name.

export const CONTACT_LIST_COLUMNS =
  'id, display_name, kind, status, source, next_action, next_action_at, last_interaction_at, owner_id, crm_organizations(name)';
/** The same without the owner: a closer's rows never carry it. */
const CONTACT_LIST_COLUMNS_CLOSER =
  'id, display_name, kind, status, source, next_action, next_action_at, last_interaction_at, crm_organizations(name)';

/** How the person was last reached: a value of `interaction_channel`, which is also the key of `crmContacts.channels`. */
export type ContactChannel = NonNullable<Tables<'crm_interactions'>['channel']>;

/** Origins that are a channel in themselves: a lead that came by a form has not been answered by any other yet. */
const SOURCE_CHANNEL: Partial<Record<Tables<'crm_contacts'>['source'], ContactChannel>> = {
  web_form: 'web_form',
  partner_form: 'web_form',
  web_proposal: 'web_proposal',
  chat: 'chat',
  calcom: 'calcom',
};

/** The «Canal» column: the channel of the last interaction that had one, else the one the contact came through. */
export function contactChannel(
  lastChannel: ContactChannel | null,
  source: Tables<'crm_contacts'>['source'] | null,
): ContactChannel | null {
  return lastChannel ?? (source ? (SOURCE_CHANNEL[source] ?? null) : null);
}

export interface ContactRow {
  id: string;
  display_name: string;
  kind: ContactKind;
  status: string;
  next_action: string | null;
  next_action_at: string | null;
  last_interaction_at: string | null;
  organization: string | null;
  /** See `contactChannel`; `null` when nothing says how to reach them yet. */
  channel: ContactChannel | null;
  /** Admin only: `null` for a closer's rows (and for the contacts of Jose). */
  owner_id: string | null;
}

export interface Owner {
  user_id: string;
  display_name: string;
  role: StaffRole;
  disabled: boolean;
  /** Commission rate in percent (the admin reads everyone's). */
  rate: number;
}

export interface ContactPage {
  rows: ContactRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Admin only. */
  owners: Owner[] | null;
  /** What the inbox filtered by, normalised. */
  query: ContactListQuery;
}

/** The search text goes into a PostgREST `or=(…)` filter: commas, parentheses and wildcards would change its meaning. */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()*%_\\":]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** The slice of the query builder the filters need (typed loosely: the builder's generics are not worth repeating). */
interface Filterable<T> {
  eq(column: string, value: unknown): T;
  is(column: string, value: null): T;
  or(filter: string): T;
  in(column: string, values: readonly string[]): T;
  lte(column: string, value: string): T;
}

/**
 * Applies the filters of the URL. `owner` only counts for the admin: a closer's filter is her own portfolio, which
 * RLS already gives, and an owner id from her URL must not even reach the query.
 */
export function applyContactFilters<T extends Filterable<T>>(
  builder: T,
  query: ContactListQuery,
  options: {
    role: StaffRole;
    userId: string;
    organizationIds: readonly string[] | null;
    /** The contacts one import touched (`?import=`); `null` when the URL does not ask for it. */
    importedIds?: readonly string[] | null;
    now?: Date;
  },
): T {
  let next = builder.is('archived_at', null);
  if (query.kind) next = next.eq('kind', query.kind);
  if (query.status) next = next.eq('status', query.status);
  if (query.due) next = next.lte('next_action_at', (options.now ?? new Date()).toISOString());
  if (query.q) {
    const text = sanitizeSearch(query.q);
    if (text) {
      const parts = [`display_name.ilike.*${text}*`, `email.ilike.*${text}*`];
      if (options.organizationIds?.length) parts.push(`organization_id.in.(${options.organizationIds.join(',')})`);
      next = next.or(parts.join(','));
    }
  }
  if (options.importedIds) next = next.eq('source', 'import_csv').in('id', options.importedIds);
  if (options.role === 'admin' && query.owner) {
    if (query.owner === 'unassigned') next = next.is('owner_id', null);
    else if (query.owner === 'mine') next = next.or(`owner_id.is.null,owner_id.eq.${options.userId}`);
    else next = next.eq('owner_id', query.owner);
  }
  return next;
}

function toRow(
  row: unknown,
  role: StaffRole,
  lastChannels: ReadonlyMap<string, ContactChannel> = new Map(),
): ContactRow {
  const record = row as ContactRow & {
    crm_organizations: { name: string } | null;
    source: Tables<'crm_contacts'>['source'] | null;
  };
  return {
    id: record.id,
    display_name: record.display_name,
    kind: record.kind,
    status: record.status,
    next_action: record.next_action,
    next_action_at: record.next_action_at,
    last_interaction_at: record.last_interaction_at,
    organization: record.crm_organizations?.name ?? null,
    channel: contactChannel(lastChannels.get(record.id) ?? null, record.source),
    owner_id: role === 'admin' ? (record.owner_id ?? null) : null,
  };
}

export function parseContactQuery(raw: Record<string, string | string[] | undefined>): ContactListQuery {
  const flat = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return contactListQuerySchema.parse(flat);
}

/** Staff members the admin can reassign to, or filter by. Never called for a closer. */
export async function getOwners(supabase: ServerSupabase): Promise<Owner[]> {
  const { data } = await supabase
    .from('staff_members')
    .select('user_id, role, display_name, disabled_at, commission_rate')
    .order('created_at');
  return (data ?? []).map((row) => {
    const record = row as unknown as {
      user_id: string;
      role: StaffRole;
      display_name: string | null;
      disabled_at: string | null;
      commission_rate: number | string | null;
    };
    return {
      user_id: record.user_id,
      role: record.role,
      display_name: record.display_name ?? '—',
      disabled: record.disabled_at !== null,
      rate: Number(record.commission_rate ?? 0),
    };
  });
}

/** The newest channel of each contact of the page: one read of their interactions, newest first, first one wins. */
async function getLastChannels(
  supabase: ServerSupabase,
  ids: readonly string[],
): Promise<Map<string, ContactChannel>> {
  const found = new Map<string, ContactChannel>();
  if (ids.length === 0) return found;
  const { data } = await supabase
    .from('crm_interactions')
    .select('contact_id, channel')
    .in('contact_id', [...ids])
    .not('channel', 'is', null)
    .order('occurred_at', { ascending: false })
    .limit(ids.length * 20);
  for (const row of data ?? [])
    if (row.channel && !found.has(row.contact_id)) found.set(row.contact_id, row.channel);
  return found;
}

export async function getContactPage(
  role: StaffRole,
  raw: Record<string, string | string[] | undefined>,
): Promise<ContactPage> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { supabase, user } = session;
  const query = parseContactQuery(raw);
  const page = query.page ?? 1;

  // organisations are global data: a name search also finds the people of a matching company
  let organizationIds: string[] | null = null;
  const text = query.q ? sanitizeSearch(query.q) : '';
  if (text) {
    const { data } = await supabase.from('crm_organizations').select('id').ilike('name', `%${text}%`).limit(50);
    organizationIds = (data ?? []).map((row) => row.id);
  }

  // `?import=<id>`: the contacts that import created, found by the `import` interaction its RPC left on each one
  let importedIds: string[] | null = null;
  if (query.import) {
    const { data } = await supabase
      .from('crm_interactions')
      .select('contact_id')
      .eq('kind', 'import')
      .eq('payload->>import_id', query.import)
      .limit(500);
    importedIds = (data ?? []).map((row) => row.contact_id);
  }

  const from = (page - 1) * CONTACTS_PAGE_SIZE;
  const base = supabase
    .from('crm_contacts')
    .select((role === 'admin' ? CONTACT_LIST_COLUMNS : CONTACT_LIST_COLUMNS_CLOSER) as typeof CONTACT_LIST_COLUMNS, { count: 'exact' });
  const filtered = applyContactFilters(base as unknown as Filterable<typeof base>, query, {
    role,
    userId: user.id,
    organizationIds,
    importedIds,
  }) as unknown as typeof base;
  const [list, owners] = await Promise.all([
    filtered
      .order('next_action_at', { ascending: true, nullsFirst: false })
      .order('display_name', { ascending: true })
      .range(from, from + CONTACTS_PAGE_SIZE - 1),
    role === 'admin' ? getOwners(supabase) : Promise.resolve(null),
  ]);
  if (list.error) throw new Error(list.error.message);

  const lastChannels = await getLastChannels(
    supabase,
    (list.data ?? []).map((row) => (row as unknown as { id: string }).id),
  );
  const rows = (list.data ?? []).map((row) => toRow(row, role, lastChannels));
  return {
    rows,
    total: list.count ?? rows.length,
    page,
    pageSize: CONTACTS_PAGE_SIZE,
    owners,
    query,
  };
}

/** Contacts with an overdue next action, the oldest first: the mini-list of K1. */
export async function getOverdueContacts(role: StaffRole, limit = 5): Promise<ContactRow[]> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const columns = role === 'admin' ? CONTACT_LIST_COLUMNS : CONTACT_LIST_COLUMNS_CLOSER;
  const { data, error } = await session.supabase
    .from('crm_contacts')
    .select(columns as typeof CONTACT_LIST_COLUMNS)
    .is('archived_at', null)
    .lte('next_action_at', new Date().toISOString())
    .order('next_action_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toRow(row, 'closer'));
}
