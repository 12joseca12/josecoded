import { describe, expect, it } from 'vitest';

import {
  computeAffiliateReward,
  computeUpgrade,
  formatPrice,
  priceForProposal,
  pricing,
  UpgradeError,
} from '../src';

describe('pricing.json', () => {
  it('has version 2026-09-14 and four packs', () => {
    expect(pricing.version).toBe('2026-09-14');
    expect(pricing.packs.map((p) => [p.code, p.price, p.weeks])).toEqual([
      ['P1', 900, 1],
      ['P2', 1400, 2],
      ['P3', 2500, 2],
      ['P4', 4200, 3],
    ]);
  });

  it('extras match tarifas v2', () => {
    const byCode = Object.fromEntries(pricing.extras.map((e) => [e.code, [e.price, e.billing]]));
    expect(byCode).toEqual({
      seo_basic: [250, 'one_off'],
      seo_full: [600, 'one_off'],
      geo: [300, 'one_off'],
      security_audit: [250, 'one_off'],
      maintenance_basic: [49, 'monthly'],
      maintenance_extended: [149, 'monthly'],
    });
  });

  it('exposes the two app packs from tarifas v2', () => {
    expect(pricing.apps.map((a) => [a.code, a.price, a.weeks])).toEqual([
      ['APP_MVP', 4000, 6],
      ['APP_PLUS', 6000, 8],
    ]);
  });

  it('has the companies rates: 40 EUR/h and closed feature from 150 EUR', () => {
    expect(pricing.hourly).toBe(40);
    expect(pricing.feature).toBe(150);
  });

  it('never exposes pack gifts', () => {
    expect(JSON.stringify(pricing)).not.toMatch(/regalo|gift/i);
  });

  it('has both languages on every text of every pack, app and extra', () => {
    const offers = [...pricing.packs, ...pricing.apps];
    for (const offer of offers) {
      for (const lang of ['es', 'en'] as const) {
        expect(offer.name[lang].length, `${offer.code}.name.${lang}`).toBeGreaterThan(0);
        expect(offer.forWhom[lang].length, `${offer.code}.forWhom.${lang}`).toBeGreaterThan(0);
        expect(offer.includes[lang].length, `${offer.code}.includes.${lang}`).toBeGreaterThan(0);
        for (const line of offer.includes[lang]) expect(line.length).toBeGreaterThan(0);
      }
    }
    for (const extra of pricing.extras) {
      for (const lang of ['es', 'en'] as const) {
        expect(extra.label[lang].length, `${extra.code}.label.${lang}`).toBeGreaterThan(0);
        expect(extra.description[lang].length, `${extra.code}.description.${lang}`).toBeGreaterThan(
          0,
        );
      }
    }
  });
});

describe('priceForProposal', () => {
  it('priceFrom is the pack price and never sums extras', () => {
    const r = priceForProposal('P2', ['seo_basic', 'maintenance_basic']);
    expect(r.priceFrom).toBe(1400);
    expect(r.recommendedExtras.map((e) => e.code)).toEqual(['seo_basic', 'maintenance_basic']);
    expect(r.pricingVersion).toBe('2026-09-14');
  });

  it('prices the app packs', () => {
    expect(priceForProposal('APP_MVP', []).priceFrom).toBe(4000);
    expect(priceForProposal('APP_PLUS', ['maintenance_basic']).priceFrom).toBe(6000);
  });

  it('drops duplicated extras', () => {
    expect(priceForProposal('P1', ['geo', 'geo']).recommendedExtras).toHaveLength(1);
  });

  it('rejects an unknown pack', () => {
    // @ts-expect-error deliberately wrong code
    expect(() => priceForProposal('P9', [])).toThrow();
  });
});

describe('computeUpgrade', () => {
  it('P2→P3 = 1100', () => expect(computeUpgrade('P2', 'P3', []).price).toBe(1100));
  it('P1→P4 = 3300', () => expect(computeUpgrade('P1', 'P4', []).price).toBe(3300));
  it('extras after = list price', () =>
    expect(computeUpgrade('P2', null, ['seo_full']).price).toBe(600));
  it('pack difference plus extras', () => {
    expect(computeUpgrade('P1', 'P2', ['geo', 'security_audit']).price).toBe(500 + 300 + 250);
  });
  it('dedupes repeated extras', () =>
    expect(computeUpgrade('P2', null, ['geo', 'geo']).price).toBe(300));
  it('P3→P3 throws', () => expect(() => computeUpgrade('P3', 'P3', [])).toThrow(UpgradeError));
  it('P3→P2 throws', () => expect(() => computeUpgrade('P3', 'P2', [])).toThrow(UpgradeError));
  it('nothing requested throws', () =>
    expect(() => computeUpgrade('P2', null, [])).toThrow(UpgradeError));
  it('a target pack without a current pack throws', () => {
    expect(() => computeUpgrade(null, 'P3', [])).toThrow(UpgradeError);
  });
});

describe('computeAffiliateReward', () => {
  it('standard 10 % of 1400 = 140', () => {
    expect(computeAffiliateReward('standard', 1400)).toEqual({
      type: 'percent',
      amount: 140,
      percent: 10,
    });
  });
  it('premium 20 % = 280', () => {
    expect(computeAffiliateReward('premium', 1400)).toEqual({
      type: 'percent',
      amount: 280,
      percent: 20,
    });
  });
  it('client = 2 maintenance months, whatever the base', () => {
    expect(computeAffiliateReward('client', 1400)).toEqual({
      type: 'maintenance_months',
      amount: 2,
    });
    expect(computeAffiliateReward('client', 0)).toEqual({ type: 'maintenance_months', amount: 2 });
  });
  it('keeps cents', () => {
    expect(computeAffiliateReward('standard', 1234.5).amount).toBe(123.45);
  });
  it('rejects a negative or non-finite base', () => {
    expect(() => computeAffiliateReward('standard', -1)).toThrow(RangeError);
    expect(() => computeAffiliateReward('premium', Number.NaN)).toThrow(RangeError);
  });
});

describe('formatPrice', () => {
  it('formats es and en', () => {
    expect(formatPrice(1400, 'es')).toBe('1.400 €');
    expect(formatPrice(1400, 'en')).toBe('€1,400');
  });
  it('groups bigger numbers and keeps cents when present', () => {
    expect(formatPrice(900, 'es')).toBe('900 €');
    expect(formatPrice(1234567, 'en')).toBe('€1,234,567');
    expect(formatPrice(123.45, 'es')).toBe('123,45 €');
    expect(formatPrice(123.45, 'en')).toBe('€123.45');
  });
});
