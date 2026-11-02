import { pricing } from './data';
import { findExtra } from './proposal-price';

import type { PricingData } from '@josecoded/types';

export class UpgradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpgradeError';
  }
}

/**
 * Upgrade of an existing client (tarifas «Ampliaciones»): list-price difference between packs,
 * plus extras at list price. No extra discount.
 */
export function computeUpgrade(
  from: string | null,
  to: string | null,
  extras: readonly string[],
  data: PricingData = pricing,
): { price: number; pricingVersion: string } {
  const uniqueExtras = [...new Set(extras)];
  if (to === null && uniqueExtras.length === 0) {
    throw new UpgradeError('Nothing requested: pick a higher pack or at least one extra');
  }

  let packDifference = 0;
  if (to !== null) {
    const target = data.packs.find((p) => p.code === to);
    if (!target) throw new UpgradeError(`Unknown pack: ${to}`);
    const current = from === null ? undefined : data.packs.find((p) => p.code === from);
    if (!current) throw new UpgradeError('An upgrade needs the current pack');
    if (target.price <= current.price) {
      throw new UpgradeError(`${to} is not higher than ${current.code}`);
    }
    packDifference = target.price - current.price;
  }

  const extrasPrice = uniqueExtras.reduce((sum, code) => sum + findExtra(code, data).price, 0);
  return { price: packDifference + extrasPrice, pricingVersion: data.version };
}
