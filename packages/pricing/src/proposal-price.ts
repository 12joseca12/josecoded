import { pricing } from './data';

import type { AppCode, AppPack, Extra, ExtraCode, Pack, PackCode } from '@josecoded/types';

export interface ProposalPrice {
  /** The closed price of the pack. NEVER adds extras (UX §4.4, DT H8). */
  priceFrom: number;
  pack: Pack | AppPack;
  recommendedExtras: Extra[];
  pricingVersion: string;
}

export function findExtra(code: ExtraCode): Extra {
  const extra = pricing.extras.find((e) => e.code === code);
  if (!extra) throw new Error(`Unknown extra: ${code}`);
  return extra;
}

export function priceForProposal(pack: PackCode | AppCode, extras: ExtraCode[]): ProposalPrice {
  const found =
    pricing.packs.find((p) => p.code === pack) ?? pricing.apps.find((a) => a.code === pack);
  if (!found) throw new Error(`Unknown pack: ${pack}`);
  return {
    priceFrom: found.price,
    pack: found,
    recommendedExtras: [...new Set(extras)].map(findExtra),
    pricingVersion: pricing.version,
  };
}
