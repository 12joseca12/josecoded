import { describe, expect, it } from 'vitest';

import { formatPrice, pricing } from '@josecoded/pricing';

import { faqEntries, faqVars } from './faq';
import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('fills known names, leaves unknown ones visible and never touches a pending marker', () => {
    expect(interpolate('Desde {a}, plazo {b}.', { a: '900 €' })).toBe('Desde 900 €, plazo {b}.');
    expect(interpolate('{{DATO: precio {a}}}', { a: 'x' })).toBe('{{DATO: precio {a}}}');
  });
});

describe('faq entries', () => {
  it('quote the prices and weeks of pricing.json, never a number of their own', () => {
    const entries = faqEntries('services', 'es');
    const rate = entries.find((entry) => entry.id === 'hourly-rate');
    expect(rate?.answer).toContain(formatPrice(pricing.hourly, 'es').replaceAll(' ', ' '));
    const time = entries.find((entry) => entry.id === 'packs-time');
    expect(time?.answer).not.toMatch(/\{\w+\}/);
    expect(time?.answer).toContain('1 semana');
  });

  it('filters by way and fills every variable in both languages', () => {
    for (const locale of ['es', 'en'] as const) {
      const vars = faqVars(locale);
      for (const entry of faqEntries('services', locale)) {
        if (!entry.answer.startsWith('{{DATO')) expect(entry.answer).not.toMatch(/\{\w+\}/);
      }
      expect(faqEntries('services', locale, 'hiring').every((entry) => entry.id.startsWith('hiring'))).toBe(true);
      expect(Object.keys(vars)).toContain('priceP5plus');
    }
  });
});
