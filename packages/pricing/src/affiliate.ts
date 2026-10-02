import { pricing } from './data';

export type AffiliateLevel = 'client' | 'standard' | 'premium';

export type AffiliateReward =
  | { type: 'maintenance_months'; amount: number }
  | { type: 'percent'; amount: number; percent: number };

/**
 * Reward for a paid first order. `baseAmount` is pack + one-off extras of that first order,
 * without VAT; recurring maintenance and later upgrades are not part of the base.
 * `client` is derived by the RPC `admin_close_lead_paid` (affiliate with a row in `clients`).
 */
export function computeAffiliateReward(level: AffiliateLevel, baseAmount: number): AffiliateReward {
  if (level === 'client') {
    return { type: 'maintenance_months', amount: pricing.affiliate.client.maintenanceMonths };
  }
  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new RangeError('baseAmount must be a non-negative number');
  }
  const { percent } = pricing.affiliate[level];
  return { type: 'percent', amount: Math.round(baseAmount * percent) / 100, percent };
}
