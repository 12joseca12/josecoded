import { pricing } from './data';
import { findExtra } from './proposal-price';

import type { ExtraCode, PackCode } from '@josecoded/types';

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
  from: PackCode | null,
  to: PackCode | null,
  extras: ExtraCode[],
): { price: number; pricingVersion: string } {
  const uniqueExtras = [...new Set(extras)];
  if (to === null && uniqueExtras.length === 0) {
    throw new UpgradeError('Nothing requested: pick a higher pack or at least one extra');
  }

  let packDifference = 0;
  if (to !== null) {
    const target = pricing.packs.find((p) => p.code === to);
    if (!target) throw new UpgradeError(`Unknown pack: ${to}`);
    const current = from === null ? undefined : pricing.packs.find((p) => p.code === from);
    if (!current) throw new UpgradeError('An upgrade needs the current pack');
    if (target.price <= current.price) {
      throw new UpgradeError(`${to} is not higher than ${current.code}`);
    }
    packDifference = target.price - current.price;
  }

  const extrasPrice = uniqueExtras.reduce((sum, code) => sum + findExtra(code).price, 0);
  return { price: packDifference + extrasPrice, pricingVersion: pricing.version };
}
