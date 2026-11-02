import { describe, expect, it } from 'vitest';

import { formatPrice, pricing } from '@josecoded/pricing';

import { extraItems, packColumns } from './packs';

const copy = {
  names: { P1: 'a', P2: 'b', P3: 'c', P4: 'd', P5: 'e' },
  includes: { P1: 'i1', P2: 'i2', P3: 'i3', P4: 'i4', P5: 'i5' },
  from: (price: string) => `Desde ${price}`,
  request: 'r',
  requestName: ({ name, code }: { name: string; code: string }) => `${name} ${code}`,
  plus: { name: 'plus', includes: 'pi', intro: ({ price }: { name: string; price: string; weeks: string }) => `desde ${price}` },
};

describe('packColumns', () => {
  it('shows the five prices of pricing.json and the extended option inside P5', () => {
    const columns = packColumns('es', copy);
    expect(columns.map((column) => column.code)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5']);
    const [mvp, plus] = pricing.apps;
    const wanted = [...pricing.packs.map((pack) => pack.price), mvp!.price];
    expect(columns.map((column) => column.price.replace(/\D/g, ''))).toEqual(wanted.map(String));
    expect(columns[4]?.option?.intro).toContain(formatPrice(plus!.price, 'es').replaceAll(' ', ' '));
  });

  it('falls back to the page copy while the English text of the list is pending', () => {
    const columns = packColumns('en', copy);
    expect(columns[0]?.includes).toBe('i1');
    expect(columns[0]?.name).toBe('a');
  });
});

describe('extraItems', () => {
  it('lists every extra on sale with its price and a monthly suffix', () => {
    const items = extraItems('es', { names: {}, monthly: '/mes' });
    expect(items.find((item) => item.code === 'maintenance_basic')?.price).toMatch(/49.*\/mes$/);
    expect(items).toHaveLength(pricing.extras.filter((extra) => extra.active !== false && extra.visible !== false).length);
  });
});
