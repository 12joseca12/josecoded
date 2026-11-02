import { cache } from 'react';

import { getAdminCounters } from '@/lib/admin/queries';
import { getOptionalSession } from '@/lib/auth/guards';
import { rpcJson } from '@/lib/supabase/rpc-json';

import type { StaffRole } from '@/lib/auth/staff';
import type { AdminCounters, CloserCounters, TeamCounters } from '@josecoded/types';

// Reads of the CRM summary (K1). Every call runs with the user's JWT, so the RPCs decide what each role gets;
// `cache` makes the layout (badge of the rail) and the page (cards) share one call per RPC in a request.

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

/**
 * Overdue contacts for the badge of Contactos in the shell, from the cheapest RPC that has them: the closer's own
 * counters, or `admin_counters()` for the admin (his own set only covers contacts without owner). Shares the cache
 * with the summary, so the home asks nothing twice. A failure hides the badge (`null`) instead of taking the whole
 * shell down: the page itself still fails loudly if it needs the same numbers.
 */
export const getOverdueCount = cache(async (role: StaffRole): Promise<number | null> => {
  try {
    return role === 'admin' ? (await getAdminCounters()).contacts_due : (await getMyCounters()).contacts_due;
  } catch {
    return null;
  }
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
