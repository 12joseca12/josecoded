import { cache } from 'react';

import { rpcJson } from '@/lib/supabase/rpc-json';

import { adminFetch } from './gateway';

import type { AdminCounters } from '@josecoded/types';

// Reads of the admin summary (C1). `cache` dedupes them between the layout and the page of a request, and
// between /admin and the admin card of /crm: one RPC call per render.

/** `admin_counters()` (13 counters, DATOS §6 and §14). Throws if it cannot be read: a zero would lie. */
export const getAdminCounters = cache(() => rpcJson<AdminCounters>('admin_counters'));

/** `unconfigured`: the gateway has no Omen to ask (no URL or token); the summary hides the row. */
export type OmenStatus = 'online' | 'offline' | 'unconfigured';

/**
 * Whether Omen answers, through the gateway (`GET /api/v1/system/status`, the admin's JWT). A 2xx is `online`;
 * `503 worker_not_configured` is `unconfigured` (there is no Omen to report on, so the card says nothing); any
 * other answer (502 when Omen is down, a timeout, a missing session) is `offline`: the card says so, the page
 * does not fail because the home server fell.
 */
export const getOmenStatus = cache(async (): Promise<OmenStatus> => {
  try {
    const response = await adminFetch('/api/v1/system/status', { signal: AbortSignal.timeout(3000) });
    if (response.ok) return 'online';
    if (response.status === 503 && (await isNotConfigured(response))) return 'unconfigured';
    return 'offline';
  } catch {
    return 'offline';
  }
});

async function isNotConfigured(response: Response): Promise<boolean> {
  try {
    const body = (await response.json()) as { error?: { code?: string } } | null;
    return body?.error?.code === 'worker_not_configured';
  } catch {
    return false;
  }
}
