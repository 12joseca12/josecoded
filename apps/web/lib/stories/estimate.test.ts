import { describe, expect, it } from 'vitest';

import { parseAmount, parseHours } from './estimate';

describe('parseHours', () => {
  it('reads hours with a point or a comma and at most one decimal', () => {
    expect(parseHours('6')).toBe(6);
    expect(parseHours('6.5')).toBe(6.5);
    expect(parseHours(' 6,5 ')).toBe(6.5);
    expect(parseHours('0.5')).toBe(0.5);
  });

  it('refuses what the database would refuse or truncate: zero, negative, two decimals, text, empty', () => {
    for (const text of ['', ' ', '0', '-1', '6.25', 'seis', '1e3', '6h', '10000', undefined]) {
      expect(parseHours(text)).toBeNull();
    }
  });
});

describe('parseAmount', () => {
  it('reads an optional amount in euros with up to two decimals; empty means no amount', () => {
    expect(parseAmount('240')).toBe(240);
    expect(parseAmount('240,5')).toBe(240.5);
    expect(parseAmount('240.55')).toBe(240.55);
    expect(parseAmount('0')).toBe(0);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  it('refuses negatives, three decimals, text and an amount the column cannot hold', () => {
    for (const text of ['-1', '1.234', 'mucho', '1e3', '100000000']) {
      expect(parseAmount(text)).toBe('invalid');
    }
  });
});
