import { pricing } from './data';

import type { AppPack, Extra, Pack, PricingData } from '@josecoded/types';

export interface ProposalPrice {
  /** The closed price of the pack. NEVER adds extras (UX §4.4, DT H8). */
  priceFrom: number;
  pack: Pack | AppPack;
  recommendedExtras: Extra[];
  pricingVersion: string;
}

/** `data` defaults to the compiled file; the gateway passes the published catalogue (task 3.7b). */
export function findExtra(code: string, data: PricingData = pricing): Extra {
  const extra = data.extras.find((e) => e.code === code);
  if (!extra) throw new Error(`Unknown extra: ${code}`);
  return extra;
}

export function priceForProposal(
  pack: string,
  extras: readonly string[],
  data: PricingData = pricing,
): ProposalPrice {
  const found = data.packs.find((p) => p.code === pack) ?? data.apps.find((a) => a.code === pack);
  if (!found) throw new Error(`Unknown pack: ${pack}`);
  return {
    priceFrom: found.price,
    pack: found,
    recommendedExtras: [...new Set(extras)].map((code) => findExtra(code, data)),
    pricingVersion: data.version,
  };
}
