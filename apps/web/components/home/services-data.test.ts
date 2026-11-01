import { describe, expect, it } from 'vitest';

import { pricing } from '@josecoded/pricing';

import { PACK_CODES, servicePrices } from './services-data';

const plain = (text: string) => text.replaceAll(' ', ' ');

describe('servicePrices', () => {
  it('shows five packs, P5 included, with the figures of pricing.json', () => {
    const { packs } = servicePrices('es');
    expect(packs.map((p) => p.code)).toEqual([...PACK_CODES]);
    expect(packs.map((p) => plain(p.price))).toEqual(['900 €', '1.400 €', '2.500 €', '4.200 €', '4.000 €']);
    expect(pricing.packs.map((p) => p.price)).toEqual([900, 1400, 2500, 4200]);
    expect(pricing.apps.find((a) => a.code === 'APP_MVP')?.price).toBe(4000);
  });

  it('reads the hourly and feature rates and the cheapest pack from pricing', () => {
    const prices = servicePrices('es');
    expect(plain(prices.hourly)).toBe('40 €');
    expect(plain(prices.feature)).toBe('150 €');
    expect(plain(prices.fromPack)).toBe('900 €');
    expect(servicePrices('en').hourly).toBe('€40');
  });

  it('never splits a price over two lines', () => {
    for (const { price } of servicePrices('es').packs) expect(price).not.toContain(' ');
  });
});
