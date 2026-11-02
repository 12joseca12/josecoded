import { getOwners } from './contacts';

import type { ClientRow } from './clients';
import type { Owner } from './contacts';
import type { StaffRole } from '@/lib/auth/staff';
import type { ServerSupabase } from '@/lib/supabase/server';
import type { Database, TaskStatus } from '@josecoded/types';

// The reads of K6. Everything runs with the JWT of the person: `staff_clients()` returns a closer the clients of her
// own contacts and the admin all of them, and RLS gives her no row of the tasks or stories of anybody else's client.
// A closer asking for a client that is not hers gets `null` (the page turns it into the 404 of an id that does not
// exist). A failed read throws: an empty list would pass for «you have no clients».

type StaffClient = Database['public']['Functions']['staff_clients']['Returns'][number];

type ContactInfo = {
  id: string;
  display_name: string;
  email: string | null;
  owner_id: string | null;
  crm_organizations: { name: string } | null;
};

/** The clients with the person, the business, the state of the access and the stories waiting, in one pass. */
async function loadRows(supabase: ServerSupabase, role: StaffRole, clientId?: string): Promise<ClientRow[]> {
  const { data, error } = await supabase.rpc('staff_clients', clientId ? { p_client_id: clientId } : undefined);
  if (error) throw new Error(error.message);
  const clients: StaffClient[] = data ?? [];
  if (clients.length === 0) return [];

  const contactIds = clients.map((client) => client.contact_id);
  const clientIds = clients.map((client) => client.id);
  const [contacts, invitations, stories] = await Promise.all([
    supabase.from('crm_contacts').select('id, display_name, email, owner_id, crm_organizations(name)').in('id', contactIds),
    supabase
      .from('crm_interactions')
      .select('contact_id, occurred_at')
      .eq('kind', 'client_invited')
      .in('contact_id', contactIds)
      .order('occurred_at', { ascending: false }),
    supabase.from('client_user_stories').select('client_id').eq('status', 'proposed').in('client_id', clientIds),
  ]);
  for (const result of [contacts, invitations, stories]) if (result.error) throw new Error(result.error.message);

  const contactById = new Map((contacts.data as unknown as ContactInfo[]).map((contact) => [contact.id, contact]));
  // newest first: the first one of a contact wins
  const invitedAt = new Map<string, string>();
  for (const row of invitations.data ?? []) if (row.contact_id && !invitedAt.has(row.contact_id)) invitedAt.set(row.contact_id, row.occurred_at);
  const pending = new Map<string, number>();
  for (const row of stories.data ?? []) pending.set(row.client_id, (pending.get(row.client_id) ?? 0) + 1);

  return clients.map((client): ClientRow => {
    const contact = contactById.get(client.contact_id);
    const invited = invitedAt.get(client.contact_id);
    return {
      id: client.id,
      contactId: client.contact_id,
      name: contact?.display_name ?? '—',
      organization: contact?.crm_organizations?.name ?? null,
      email: contact?.email || null,
      packCode: client.pack_code,
      packOption: client.pack_option || null,
      phase: client.project_phase,
      access: client.has_access ? { state: 'active' } : invited ? { state: 'invited', at: invited } : { state: 'none' },
      // a closer's rows carry no owner: she is the owner, and nobody else's id may travel to her page
      ownerId: role === 'admin' ? (contact?.owner_id ?? null) : null,
      storiesPending: pending.get(client.id) ?? 0,
    };
  });
}

export interface ClientList {
  rows: ClientRow[];
  /** The staff, for the admin only: the names of the «Dueño» column. */
  owners: Owner[] | null;
}

/** Every client the person may see, the latest first. */
export async function getClientList(supabase: ServerSupabase, role: StaffRole): Promise<ClientList> {
  const [rows, owners] = await Promise.all([loadRows(supabase, role), role === 'admin' ? getOwners(supabase) : Promise.resolve(null)]);
  return { rows, owners };
}

export interface ClientTask {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface ClientStory {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: string[];
  status: Database['public']['Enums']['story_status'];
  created_at: string;
  estimate_hours: number | null;
  estimate_amount: number | null;
  estimate_note: string | null;
  decided_at: string | null;
  task_id: string | null;
}

export interface ClientAsset {
  id: string;
  name: string;
  sizeBytes: number | null;
}

export interface ClientFile {
  client: ClientRow;
  /** Admin only. */
  owner: Owner | null;
  tasks: ClientTask[];
  stories: ClientStory[];
  /** What the client uploaded: the admin's card only; `null` for a closer. */
  assets: ClientAsset[] | null;
}

const STORY_COLUMNS =
  'id, title, as_a, i_want, so_that, acceptance_criteria, status, created_at, estimate_hours, estimate_amount, estimate_note, decided_at, task_id';

/** The file of one client, or `null` when this person cannot see it (it does not exist, or it is not in her portfolio). */
export async function getClientFile(supabase: ServerSupabase, role: StaffRole, id: string): Promise<ClientFile | null> {
  const [client] = await loadRows(supabase, role, id);
  if (!client) return null;

  const [tasks, stories, assets, owners] = await Promise.all([
    supabase.from('client_tasks').select('id, title, status').eq('client_id', id).order('sort').order('created_at'),
    supabase.from('client_user_stories').select(STORY_COLUMNS).eq('client_id', id).order('created_at', { ascending: false }),
    role === 'admin'
      ? supabase.from('client_assets').select('id, file_name, title, size_bytes').eq('client_id', id).order('created_at', { ascending: false })
      : Promise.resolve(null),
    role === 'admin' ? getOwners(supabase) : Promise.resolve(null),
  ]);
  for (const result of [tasks, stories, assets]) if (result?.error) throw new Error(result.error.message);

  return {
    client,
    owner: owners?.find((owner) => owner.user_id === client.ownerId) ?? null,
    tasks: tasks.data ?? [],
    stories: (stories.data ?? []).map((story) => ({
      ...story,
      estimate_hours: story.estimate_hours === null ? null : Number(story.estimate_hours),
      estimate_amount: story.estimate_amount === null ? null : Number(story.estimate_amount),
    })),
    assets: assets
      ? (assets.data ?? []).map((asset) => ({ id: asset.id, name: asset.file_name ?? asset.title ?? '—', sizeBytes: asset.size_bytes }))
      : null,
  };
}
