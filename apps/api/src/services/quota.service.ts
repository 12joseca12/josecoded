// Daily and windowed quotas over the QuotaStore port (public.increment_quota). A counter that cannot be read lets the
// request through and is logged as `quota_unavailable` (plan 3.7 v2.1: Supabase down must not take the site down; the
// native rate limiter and the AI Gateway budget still cap the cost).
import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';

/** `yyyymmdd` in UTC from the injected clock. */
export function dayKey(deps: Pick<Deps, 'clock'>): string {
  return deps.clock.now().toISOString().slice(0, 10).replace(/-/g, '');
}

export const DAY_SECONDS = 24 * 60 * 60;

/** `true` while within the limit, or when the counter is unavailable. */
export async function checkQuota(
  deps: Pick<Deps, 'quota'>,
  scope: string,
  key: string,
  limit: number,
  ttlSeconds: number,
): Promise<boolean> {
  if (!deps.quota) {
    logEvent(scope, 'quota_unavailable', { reason: 'no_store' });
    return true;
  }
  try {
    return await deps.quota.hit(key, limit, ttlSeconds);
  } catch {
    logEvent(scope, 'quota_unavailable', { reason: 'rpc_error' });
    return true;
  }
}

export function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
