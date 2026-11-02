import { pricing } from '@josecoded/pricing';

import type { PricingData, PricingSource } from '@josecoded/types';

export interface FakePricing extends PricingSource {
  /** How many times `get` was called (services must read it once per request). */
  calls: number;
  data: PricingData;
}

/**
 * PricingSource over the compiled catalogue with some prices replaced: `{ P2: 1500, seo_basic: 300 }`, by pack, app or
 * extra code, and `hourly` / `feature`. Pass `version` to tell it apart from the compiled one.
 */
export function createFakePricing(prices: Record<string, number> = {}, version = '2026-11-02.1'): FakePricing {
  const data: PricingData = structuredClone(pricing);
  data.version = version;
  for (const offer of [...data.packs, ...data.apps, ...data.extras]) {
    const price = prices[offer.code];
    if (price !== undefined) offer.price = price;
  }
  if (prices.hourly !== undefined) data.hourly = prices.hourly;
  if (prices.feature !== undefined) data.feature = prices.feature;
  const fake: FakePricing = {
    calls: 0,
    data,
    async get() {
      fake.calls += 1;
      return data;
    },
  };
  return fake;
}
