// How the services read the catalogue (plan 3.7b): once per request, from the published one; the compiled file only
// when no source is wired (tests, a gateway without the secret key).
import { pricing as compiled, priceForProposal, type ProposalPrice } from '@josecoded/pricing';

import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';
import type { PricingData } from '@josecoded/types';

export async function loadPricing(deps: Pick<Deps, 'pricing'>): Promise<PricingData> {
  return deps.pricing ? deps.pricing.get() : compiled;
}

/**
 * `priceForProposal` against the published catalogue, tolerant of the admin having changed it since the visitor saw a
 * proposal: extras that are gone or not on sale are dropped, and a pack that is gone or not on sale is priced from the
 * compiled catalogue (logged), so a hidden pack never turns a visitor's request into an error.
 */
export function priceProposalSafely(data: PricingData, pack: string, extras: readonly string[]): ProposalPrice {
  const onSale = extras.filter((code) => data.extras.some((e) => e.code === code && e.active !== false));
  const offer = [...data.packs, ...data.apps].find((p) => p.code === pack);
  if (offer && offer.active !== false) return priceForProposal(pack, onSale, data);
  logEvent('pricing', 'pack_not_on_sale', { pack });
  const base = compiled;
  return priceForProposal(pack, extras.filter((code) => base.extras.some((e) => e.code === code)), base);
}

/** Is `code` a pack or app of the catalogue that is on sale? */
export function isOnSale(data: PricingData, code: string): boolean {
  return [...data.packs, ...data.apps].some((p) => p.code === code && p.active !== false);
}

/**
 * The offer a proposal may point at: `code` itself when it is on sale, otherwise the on-sale offer of the same kind (pack or app)
 * with the nearest price (the cheaper one on a tie), so a rule that names a pack the admin switched off never prices a hidden pack.
 * `null` when nothing of that kind is on sale.
 */
export function nearestOnSale(data: PricingData, code: string): { code: string; reassigned: boolean } | null {
  if (isOnSale(data, code)) return { code, reassigned: false };
  const isApp = data.apps.some((a) => a.code === code);
  const target = [...data.packs, ...data.apps].find((p) => p.code === code)?.price ?? compiled[isApp ? 'apps' : 'packs'].find((p) => p.code === code)?.price ?? 0;
  const candidates = (isApp ? data.apps : data.packs).filter((p) => p.active !== false);
  const best = [...candidates].sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target) || a.price - b.price)[0];
  return best ? { code: best.code, reassigned: true } : null;
}
