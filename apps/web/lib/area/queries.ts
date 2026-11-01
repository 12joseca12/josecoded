import { cache } from 'react';

import { getOptionalSession } from '@/lib/auth/guards';

import type { Session } from '@/lib/auth/guards';
import type { Tables } from '@josecoded/types';

// Reads of the client area. Every query runs with the USER's JWT, so RLS decides what comes back;
// the explicit filters below are a second wall (and an index), never the only one. `cache` dedupes a
// query between the layout and the page of the same request.

/** The columns of `clients` a user may read (column grant: never notes_internal nor the CRM links). */
export type AreaClient = Pick<
  Tables<'clients'>,
  'id' | 'pack_code' | 'pack_option' | 'project_phase' | 'starts_at' | 'delivered_at' | 'created_at'
>;
export type AreaLead = {
  pack_code: string;
  pack_option: string | null;
  price_from: number;
  status: Tables<'leads'>['status'];
  created_at: string;
};
export type AreaProfile = Pick<Tables<'user_profiles'>, 'display_name' | 'first_audience' | 'locale'>;

export interface AreaContext {
  session: Session;
  /** The project of this user; null when they are not a client (or are staff, who use the CRM). */
  client: AreaClient | null;
  lead: AreaLead | null;
  profile: AreaProfile | null;
  isAdmin: boolean;
}

const CLIENT_COLUMNS = 'id, pack_code, pack_option, project_phase, starts_at, delivered_at, created_at';

/**
 * Who is looking and what they have. For a user without a client it asks the database once to link
 * an invitation (`claim_client_access`: idempotent, it checks the confirmed email inside) so that a
 * client invited AFTER their first sign-in still finds their project the next time they open the area.
 * Staff never get a client here: RLS lets an admin read every client, and the area is not their tool.
 */
export const getAreaContext = cache(async (): Promise<AreaContext | null> => {
  const session = await getOptionalSession();
  if (!session) return null;
  const { supabase, user } = session;

  const [{ data: staff }, { data: profile }] = await Promise.all([
    supabase.from('staff_members').select('role').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_profiles').select('display_name, first_audience, locale').eq('user_id', user.id).maybeSingle(),
  ]);
  const isAdmin = staff?.role === 'admin';

  let client: AreaClient | null = null;
  if (!isAdmin) {
    const read = async () => {
      const { data } = await supabase.from('clients').select(CLIENT_COLUMNS).limit(1).maybeSingle();
      return data;
    };
    client = await read();
    if (!client) {
      const { data: claimed } = await supabase.rpc('claim_client_access');
      if (claimed) client = await read();
    }
  }

  let lead: AreaLead | null = null;
  if (!client && !isAdmin) {
    // raises 42501 while the email is unconfirmed: then there is simply no summary
    const { data } = await supabase.rpc('area_lead_summary');
    lead = (data?.[0] as AreaLead | undefined) ?? null;
  }

  return { session, client, lead, profile: profile ?? null, isAdmin };
});

export type AreaTask = Pick<Tables<'client_tasks'>, 'id' | 'title' | 'description' | 'status' | 'sort' | 'due_at'>;
export type AreaComment = Pick<
  Tables<'client_task_comments'>,
  'id' | 'task_id' | 'author_user_id' | 'body' | 'created_at'
>;

const TASK_COLUMNS = 'id, title, description, status, sort, due_at';
const COMMENT_COLUMNS = 'id, task_id, author_user_id, body, created_at';

/** Tasks of the client, in the order Jose set (`sort`). */
export const getTasks = cache(async (clientId: string): Promise<AreaTask[]> => {
  const session = await getOptionalSession();
  if (!session) return [];
  const { data } = await session.supabase
    .from('client_tasks')
    .select(TASK_COLUMNS)
    .eq('client_id', clientId)
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true });
  return data ?? [];
});

/** One task of this client, or null (also when it belongs to someone else: RLS hides it). */
export async function getTask(clientId: string, taskId: string): Promise<AreaTask | null> {
  const session = await getOptionalSession();
  if (!session) return null;
  const { data } = await session.supabase
    .from('client_tasks')
    .select(TASK_COLUMNS)
    .eq('client_id', clientId)
    .eq('id', taskId)
    .maybeSingle();
  return data;
}

/** Visible comments (never `internal`), newest first, optionally of one task. */
export async function getComments(
  clientId: string,
  options: { taskId?: string; limit?: number; ascending?: boolean } = {},
): Promise<AreaComment[]> {
  const session = await getOptionalSession();
  if (!session) return [];
  let query = session.supabase
    .from('client_task_comments')
    .select(COMMENT_COLUMNS)
    .eq('client_id', clientId)
    .eq('internal', false)
    .order('created_at', { ascending: options.ascending ?? false });
  if (options.taskId) query = query.eq('task_id', options.taskId);
  if (options.limit) query = query.limit(options.limit);
  const { data } = await query;
  return data ?? [];
}
