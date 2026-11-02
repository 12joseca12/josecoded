import { cache } from 'react';

import { getOptionalSession } from '@/lib/auth/guards';

import { adminFetch } from './gateway';

import type { AdminCounters } from '@josecoded/types';

// Reads of the admin summary (C1). `cache` dedupes them between the layout and the page of a request, and
// between /admin and the admin card of /crm: one RPC call per render.

/** `admin_counters()` (13 counters, DATOS §6 and §14). Throws if it cannot be read: a zero would lie. */
export const getAdminCounters = cache(async (): Promise<AdminCounters> => {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { data, error } = await session.supabase.rpc('admin_counters');
  if (error || data === null) throw new Error(error?.message ?? 'admin_counters returned nothing');
  return data as unknown as AdminCounters;
});

export type OmenStatus = 'online' | 'offline';

/**
 * Whether Omen answers, through the gateway (`GET /api/v1/system/status`, the admin's JWT). Anything that is
 * not a 2xx (502 when Omen is down, a timeout, a missing session) is «offline»: the card says so, the page
 * does not fail because the home server fell.
 */
export const getOmenStatus = cache(async (): Promise<OmenStatus> => {
  try {
    const response = await adminFetch('/api/v1/system/status', { signal: AbortSignal.timeout(3000) });
    return response.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
});
