// Daily and windowed quotas over the QuotaStore port (public.increment_quota). A counter that cannot be read lets the
// request through and is logged as `quota_unavailable` (plan 3.7 v2.1: Supabase down must not take the site down; the
// native rate limiter and the AI Gateway budget still cap the cost). Failing open is silent to the visitor, so Jose
// gets one Telegram alert per isolate per hour while counters are down (the AI Gateway budget is then the only cap).
import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';

/** `yyyymmdd` in UTC from the injected clock. */
export function dayKey(deps: Pick<Deps, 'clock'>): string {
  return deps.clock.now().toISOString().slice(0, 10).replace(/-/g, '');
}

export const DAY_SECONDS = 24 * 60 * 60;

const QUOTA_ALERT_EVERY_MS = 60 * 60_000;
let lastQuotaAlertAt = Number.NEGATIVE_INFINITY;
/** Tests only: the alert is throttled per isolate. */
export function resetQuotaAlert(): void {
  lastQuotaAlertAt = Number.NEGATIVE_INFINITY;
}

/** Once an hour per isolate (the counters that would dedupe it are the ones that are down). Best effort. */
async function alertQuotaUnavailable(deps: Partial<Pick<Deps, 'telegram' | 'clock'>>, scope: string, reason: string): Promise<void> {
  const now = deps.clock?.now().getTime() ?? Date.now();
  if (!deps.telegram || now - lastQuotaAlertAt < QUOTA_ALERT_EVERY_MS) return;
  lastQuotaAlertAt = now;
  try {
    await deps.telegram.sendMessage(
      `Cuotas no disponibles (${scope}: ${reason}). Las peticiones pasan sin tope diario; solo queda el límite del AI Gateway. Revisa Supabase.`,
    );
  } catch {
    logEvent('alerts', 'telegram_failed');
  }
}

/** `true` while within the limit, or when the counter is unavailable (then Jose is alerted, see above). */
export async function checkQuota(
  deps: Pick<Deps, 'quota'> & Partial<Pick<Deps, 'telegram' | 'clock'>>,
  scope: string,
  key: string,
  limit: number,
  ttlSeconds: number,
): Promise<boolean> {
  if (!deps.quota) {
    logEvent(scope, 'quota_unavailable', { reason: 'no_store' });
    await alertQuotaUnavailable(deps, scope, 'no_store');
    return true;
  }
  try {
    return await deps.quota.hit(key, limit, ttlSeconds);
  } catch {
    logEvent(scope, 'quota_unavailable', { reason: 'rpc_error' });
    await alertQuotaUnavailable(deps, scope, 'rpc_error');
    return true;
  }
}

export function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
