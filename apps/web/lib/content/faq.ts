import { formatPrice, pricing } from '@josecoded/pricing';

import { faq as faqFiles } from '@/content';

import { interpolate } from './interpolate';

import type { FaqEntry } from '@/components/shared/faq';
import type { FaqFile } from '@/content/schema';
import type { Locale } from '@josecoded/types';

const nbsp = (text: string) => text.replaceAll(' ', ' ');

/** «1 semana», «2 semanas», «6 semanas» in the locale. */
export function weeksLabel(weeks: number, locale: Locale): string {
  const one = locale === 'es' ? 'semana' : 'week';
  const many = locale === 'es' ? 'semanas' : 'weeks';
  return `${weeks} ${weeks === 1 ? one : many}`;
}

/**
 * Every value a FAQ answer may quote, read from `@josecoded/pricing`: the answers never carry a
 * number of their own, so the page and the price list cannot disagree.
 */
export function faqVars(locale: Locale): Record<string, string> {
  const [mvp, plus] = pricing.apps;
  const pack = (code: string) => pricing.packs.find((candidate) => candidate.code === code);
  const vars: Record<string, string> = {
    hourly: `${nbsp(formatPrice(pricing.hourly, locale))}/h`,
    feature: nbsp(formatPrice(pricing.feature, locale)),
  };
  for (const code of ['P1', 'P2', 'P3', 'P4']) {
    const found = pack(code);
    if (found) {
      vars[`price${code}`] = nbsp(formatPrice(found.price, locale));
      vars[`weeks${code}`] = weeksLabel(found.weeks, locale);
    }
  }
  if (mvp) {
    vars.priceP5 = nbsp(formatPrice(mvp.price, locale));
    vars.weeksP5 = weeksLabel(mvp.weeks, locale);
  }
  if (plus) {
    vars.priceP5plus = nbsp(formatPrice(plus.price, locale));
    vars.weeksP5plus = weeksLabel(plus.weeks, locale);
  }
  return vars;
}

export type FaqGroup = 'services' | 'partners';

/** The entries of one FAQ file, optionally of one way, with the pricing values filled in. */
export function faqEntries(group: FaqGroup, locale: Locale, via?: FaqFile[number]['via']): FaqEntry[] {
  const vars = faqVars(locale);
  return faqFiles[group][locale]
    .filter((entry) => via === undefined || entry.via === via)
    .map((entry) => ({ id: entry.id, question: entry.question, answer: interpolate(entry.answer, vars) }));
}
