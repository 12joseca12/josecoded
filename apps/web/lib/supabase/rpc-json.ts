import { getOptionalSession } from '@/lib/auth/guards';

/** The `jsonb` counters RPCs of the staff screens; each one decides by the caller's JWT what it returns. */
export type CountersRpc = 'crm_my_counters' | 'crm_team_counters' | 'admin_counters';

/**
 * Calls a counters RPC with the caller's session. Throws if it cannot be read: a zero would lie, so the
 * caller decides how to degrade. Server only; the callers wrap it in `cache` to dedupe a render.
 */
export async function rpcJson<T>(name: CountersRpc): Promise<T> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data, error } = await session.supabase.rpc(name);
  if (error || data === null) throw new Error(error?.message ?? `${name} returned nothing`);
  return data as unknown as T;
}
