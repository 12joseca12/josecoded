import { getOptionalSession } from '@/lib/auth/guards';

import { getOwners } from './contacts';

import type { Owner } from './contacts';
import type { StaffRole } from '@/lib/auth/staff';
import type { Tables } from '@josecoded/types';

// Reads of K3. Everything runs with the JWT of the person: a closer asking for a contact that is not in her
// portfolio gets no row (RLS), which the page turns into a 404 — the same answer as for an id that does not exist.

export type ContactRecord = Pick<
  Tables<'crm_contacts'>,
  | 'id'
  | 'kind'
  | 'status'
  | 'display_name'
  | 'role'
  | 'email'
  | 'phone'
  | 'linkedin_url'
  | 'locale'
  | 'next_action'
  | 'next_action_at'
  | 'owner_note'
  | 'source'
  | 'notion_url'
  | 'tags'
  | 'owner_id'
  | 'created_at'
  | 'last_interaction_at'
  | 'archived_at'
> & { organization: { name: string; website: string | null; city: string | null } | null };

const CONTACT_COLUMNS =
  'id, kind, status, display_name, role, email, phone, linkedin_url, locale, next_action, next_action_at, owner_note, source, notion_url, tags, owner_id, created_at, last_interaction_at, archived_at, crm_organizations(name, website, city)';

export type InteractionRecord = Pick<
  Tables<'crm_interactions'>,
  'id' | 'kind' | 'channel' | 'direction' | 'subject' | 'body' | 'occurred_at' | 'actor' | 'lead_id' | 'payload'
>;

export type LeadRecord = Pick<
  Tables<'leads'>,
  'id' | 'status' | 'source' | 'pack_code' | 'pack_option' | 'amount' | 'paid_at' | 'message' | 'affiliate_code' | 'created_at'
> & { created_by: string | null };

export interface ClientRecord {
  id: string;
  user_id: string | null;
  invite_email: string | null;
  pack_code: string;
  pack_option: string | null;
  project_phase: Tables<'clients'>['project_phase'];
  has_access: boolean;
  starts_at: string | null;
  delivered_at: string | null;
}

export type StoryRecord = Pick<
  Tables<'client_user_stories'>,
  'id' | 'title' | 'as_a' | 'i_want' | 'so_that' | 'acceptance_criteria' | 'status' | 'created_at'
>;

export type DraftRecord = Pick<Tables<'crm_message_drafts'>, 'id' | 'channel' | 'subject' | 'status' | 'generated_by' | 'created_at'>;

export interface ContactDetail {
  contact: ContactRecord;
  interactions: InteractionRecord[];
  leads: LeadRecord[];
  client: ClientRecord | null;
  stories: StoryRecord[];
  drafts: DraftRecord[];
  /** Admin only: the staff list (owner name, reassignment). A closer gets `null`: other people's names never reach her. */
  owners: Owner[] | null;
}

/** State of the portal access of a client (K3 «Habilitar acceso»). Only the interaction says it was invited: `invite_email` is filled when the client is created. */
export type AccessState = { state: 'none' } | { state: 'invited'; at: string } | { state: 'active' };

export function accessState(
  client: Pick<ClientRecord, 'has_access'>,
  interactions: readonly Pick<InteractionRecord, 'kind' | 'occurred_at'>[],
): AccessState {
  if (client.has_access) return { state: 'active' };
  const invited = interactions
    .filter((interaction) => interaction.kind === 'client_invited')
    .map((interaction) => interaction.occurred_at)
    .sort()
    .at(-1);
  return invited ? { state: 'invited', at: invited } : { state: 'none' };
}

/** The contact with everything K3 shows, or `null` when this person cannot see it (does not exist, or is not hers). */
export async function getContactDetail(id: string, role: StaffRole): Promise<ContactDetail | null> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { supabase } = session;

  const { data: record, error } = await supabase
    .from('crm_contacts')
    .select(CONTACT_COLUMNS as '*')
    .eq('id', id)
    .maybeSingle();
  if (error || !record) return null;
  const raw = record as unknown as ContactRecord & { crm_organizations: ContactRecord['organization'] };
  // a closer's detail carries no owner: she is the owner, and nobody else's id may travel to her page
  const contact: ContactRecord = {
    ...raw,
    organization: raw.crm_organizations ?? null,
    owner_id: role === 'admin' ? raw.owner_id : null,
  };

  const [interactions, leads, clients, drafts, owners] = await Promise.all([
    supabase
      .from('crm_interactions')
      .select('id, kind, channel, direction, subject, body, occurred_at, actor, lead_id, payload')
      .eq('contact_id', id)
      .order('occurred_at', { ascending: false })
      .limit(100),
    supabase
      .from('leads')
      .select('id, status, source, pack_code, pack_option, amount, paid_at, message, affiliate_code, created_at, created_by')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
    supabase.rpc('staff_clients'),
    supabase
      .from('crm_message_drafts')
      .select('id, channel, subject, status, generated_by, created_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    role === 'admin' ? getOwners(supabase) : Promise.resolve(null),
  ]);

  const row = (clients.data ?? []).find((client) => client.contact_id === id);
  const client: ClientRecord | null = row
    ? {
        id: row.id,
        user_id: role === 'admin' ? row.user_id : null,
        invite_email: row.invite_email,
        pack_code: row.pack_code,
        pack_option: row.pack_option,
        project_phase: row.project_phase,
        has_access: row.has_access,
        starts_at: row.starts_at,
        delivered_at: row.delivered_at,
      }
    : null;

  const stories = client
    ? ((
        await supabase
          .from('client_user_stories')
          .select('id, title, as_a, i_want, so_that, acceptance_criteria, status, created_at')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
      ).data ?? [])
    : [];

  return {
    contact,
    interactions: (interactions.data ?? []) as InteractionRecord[],
    leads: (leads.data ?? []) as unknown as LeadRecord[],
    client,
    stories,
    drafts: drafts.data ?? [],
    owners,
  };
}

/** The affiliate level a lead's reward is computed with: `client` when the affiliate is himself a client (DATOS §6). */
export async function getAffiliateLevel(affiliateCode: string): Promise<'client' | 'standard' | 'premium' | null> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data: affiliate } = await session.supabase
    .from('affiliates')
    .select('user_id, level')
    .eq('code', affiliateCode)
    .maybeSingle();
  if (!affiliate) return null;
  const { data: clients } = await session.supabase.rpc('staff_clients');
  const isClient = (clients ?? []).some((client) => client.user_id === affiliate.user_id);
  return isClient ? 'client' : affiliate.level;
}

export interface PackChoice {
  code: string;
  label: string;
}

/** Packs on sale, for the admin to give a manual lead its pack before closing it. */
export async function getPackChoices(): Promise<PackChoice[]> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data } = await session.supabase.from('packs').select('code, name').is('deleted_at', null).eq('active', true).order('sort');
  return (data ?? []).map((pack) => {
    const names = (pack.name ?? {}) as { es?: string };
    return { code: pack.code, label: names.es ? `${pack.code} · ${names.es}` : pack.code };
  });
}
