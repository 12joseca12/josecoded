// PricingSource over `public.pricing_published()` (service role; DATOS §14.12.3, plan 3.7b). The published catalogue is what
// the public site shows; prices the admin changed but did not publish never reach a proposal or an assistant answer.
// Cached in the isolate for five minutes (like the chat contexts); `null`, an error or a value that is not a valid
// catalogue fall back to the one compiled from `content/pricing.json`, logged as `pricing_unavailable`.
import { pricing as compiled } from '@josecoded/pricing';
import { pricingSchema, type PricingData, type PricingSource } from '@josecoded/types';

import { logEvent } from '../utils/http-error';

import type { RawRpc } from './raw-rpc';

export const PRICING_TTL_MS = 5 * 60_000;
/** After a failure the fallback is kept this long, so a Supabase outage is not asked again by every request. */
export const PRICING_FAILURE_TTL_MS = 30_000;

export interface PricingCache {
  entry?: { value: PricingData; expiresAt: number };
}

/** Lives as long as the isolate: `buildDeps` runs per request, the cache must not. */
const isolateCache: PricingCache = {};

export function createPricingSource(
  rpc: RawRpc,
  options: { fallback?: PricingData; now?: () => number; cache?: PricingCache } = {},
): PricingSource {
  const { fallback = compiled, now = Date.now, cache = isolateCache } = options;
  return {
    async get() {
      const at = now();
      if (cache.entry && cache.entry.expiresAt > at) return cache.entry.value;
      try {
        const raw = await rpc.call('pricing_published');
        if (raw === null || raw === undefined) throw new Error('nothing published yet');
        const value = pricingSchema.parse(raw);
        cache.entry = { value, expiresAt: at + PRICING_TTL_MS };
        return value;
      } catch (error) {
        // the reason can name a column or a path of the catalogue, never a value or a secret
        logEvent('pricing', 'pricing_unavailable', { reason: error instanceof Error ? error.name : 'error' });
        cache.entry = { value: fallback, expiresAt: at + PRICING_FAILURE_TTL_MS };
        return fallback;
      }
    },
  };
}

/** The catalogue of the compiled file as a source: what the gateway uses without the secret key. */
export function createCompiledPricingSource(): PricingSource {
  return { async get() { return compiled; } };
}
