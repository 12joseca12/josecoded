import { cache } from 'react';

import { getAdminCounters } from '@/lib/admin/queries';
import { getOptionalSession } from '@/lib/auth/guards';

import type { StaffRole } from '@/lib/auth/staff';
import type { AdminCounters, CloserCounters, TeamCounters } from '@josecoded/types';

// Reads of the CRM summary (K1). Every call runs with the user's JWT, so the RPCs decide what each role gets;
// `cache` makes the layout (badge of the rail) and the page (cards) share one call per RPC in a request.

async function rpcJson<T>(name: 'crm_my_counters' | 'crm_team_counters'): Promise<T> {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data, error } = await session.supabase.rpc(name);
  if (error || data === null) throw new Error(error?.message ?? `${name} returned nothing`);
  return data as unknown as T;
}

/** Own portfolio: the closer's, or the admin's contacts without owner (the admin reads the whole CRM from C1). */
export const getMyCounters = cache(() => rpcJson<CloserCounters>('crm_my_counters'));

/** Numbers of the whole team, no names (global data of DATOS §14.0). */
export const getTeamCounters = cache(() => rpcJson<TeamCounters>('crm_team_counters'));

export interface CrmSummary {
  role: StaffRole;
  my: CloserCounters;
  team: TeamCounters;
  /** Only the admin asks for it: it is his window on the whole CRM. */
  admin: AdminCounters | null;
}

export const getCrmSummary = cache(async (role: StaffRole): Promise<CrmSummary> => {
  const [my, team, admin] = await Promise.all([
    getMyCounters(),
    getTeamCounters(),
    role === 'admin' ? getAdminCounters() : Promise.resolve(null),
  ]);
  return { role, my, team, admin };
});

export interface StaffIdentity {
  name: string | null;
  /** Commission rate in percent (`staff_members.commission_rate`). */
  rate: number;
}

/** The own row of `staff_members` (RLS lets a member read his): name and rate for the foot of the rail. */
export const getStaffIdentity = cache(async (): Promise<StaffIdentity> => {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data } = await session.supabase
    .from('staff_members')
    .select('display_name, commission_rate')
    .eq('user_id', session.user.id)
    .maybeSingle();
  return { name: data?.display_name ?? null, rate: Number(data?.commission_rate ?? 0) };
});
