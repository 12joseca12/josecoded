import { describe, expect, it } from 'vitest';

import { pricing } from '@josecoded/pricing';

import { isOnSale, nearestOnSale } from './pricing-lookup';

const catalogue = (off: string[]) => {
  const data = structuredClone(pricing);
  for (const offer of [...data.packs, ...data.apps]) if (off.includes(offer.code)) offer.active = false;
  return data;
};

describe('nearestOnSale', () => {
  it('keeps a pack that is on sale', () => {
    expect(nearestOnSale(catalogue([]), 'P2')).toEqual({ code: 'P2', reassigned: false });
  });

  it('reassigns an inactive pack to the nearest active pack of the same kind', () => {
    const data = catalogue(['P2']);
    const result = nearestOnSale(data, 'P2')!;
    expect(result.reassigned).toBe(true);
    expect(isOnSale(data, result.code)).toBe(true);
    expect(data.packs.some((p) => p.code === result.code)).toBe(true);
    const target = data.packs.find((p) => p.code === 'P2')!.price;
    const best = Math.min(...data.packs.filter((p) => p.active !== false).map((p) => Math.abs(p.price - target)));
    expect(Math.abs(data.packs.find((p) => p.code === result.code)!.price - target)).toBe(best);
  });

  it('an app is replaced by an app, never by a pack', () => {
    const data = catalogue(['APP_MVP']);
    const result = nearestOnSale(data, 'APP_MVP')!;
    expect(result.reassigned).toBe(true);
    expect(data.apps.some((a) => a.code === result.code)).toBe(true);
  });

  it('is null when nothing of that kind is on sale', () => {
    expect(nearestOnSale(catalogue(pricing.packs.map((p) => p.code)), 'P2')).toBeNull();
  });
});
