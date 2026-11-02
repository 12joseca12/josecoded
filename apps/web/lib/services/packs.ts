import { formatPrice, pricing } from '@josecoded/pricing';

import { datoText } from '@/components/home/dato';
import { hasDato } from '@/lib/content/dato';
import { weeksLabel } from '@/lib/content/faq';

import type { ExtraItem } from '@/components/services/extra-list';
import type { CompareColumn } from '@/components/services/pack-compare';
import type { Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

type LocalizedText = { es: string; en: string };
type LocalizedList = { es: string[]; en: string[] };

/** The text of the price list in this language, or the page's own copy while the list still has a `{{DATO}}`. */
function pick(text: LocalizedText | null | undefined, locale: Locale, fallback: string): string {
  const own = text?.[locale];
  return own !== undefined && hasDato(own) ? own : fallback;
}

function pickList(list: LocalizedList, locale: Locale, fallback: string): string {
  const own = list[locale].join(' ');
  return hasDato(own) ? own : fallback;
}

const nbsp = (text: string) => text.replaceAll(' ', ' ');

export const WEB_CODES = ['P1', 'P2', 'P3', 'P4'] as const;
export type WebCode = (typeof WEB_CODES)[number];
export const PACK_ORDER = [...WEB_CODES, 'P5'] as const;
export type PackCode = (typeof PACK_ORDER)[number];

/** What the page says about a pack, besides the numbers: the home's names and the page's own includes. */
export interface PackCopy {
  names: Record<PackCode, string>;
  includes: Record<PackCode, string>;
  from: (price: string) => string;
  request: string;
  requestName: (values: { name: string; code: string }) => string;
  plus: { name: string; includes: string; intro: (values: { name: string; price: string; weeks: string }) => string };
}

/**
 * The five columns of the comparison, from `@josecoded/pricing` (P1–P4 web, P5 the app with its
 * extended option). Numbers always come from the list; a text of the list that is still a `{{DATO}}`
 * falls back to the page's own copy (`services.packs.*`), and `forWhom` is simply left out.
 */
export function packColumns(locale: Locale, copy: PackCopy): CompareColumn[] {
  const columns: CompareColumn[] = [];
  for (const code of WEB_CODES) {
    const pack = pricing.packs.find((candidate) => candidate.code === code);
    if (!pack) continue;
    columns.push({
      code,
      name: pick(pack.name, locale, copy.names[code]),
      kind: 'web',
      price: copy.from(nbsp(formatPrice(pack.price, locale))),
      weeks: weeksLabel(pack.weeks, locale),
      includes: pickList(pack.includes, locale, copy.includes[code]),
      forWhom: pack.forWhom ? datoText(pack.forWhom[locale]) : null,
      href: `/propuesta?pack=${code}`,
      requestName: copy.requestName({ name: pick(pack.name, locale, copy.names[code]), code }),
    });
  }
  const [mvp, plus] = pricing.apps;
  if (mvp) {
    const name = pick(mvp.name, locale, copy.names.P5);
    const option: CompareColumn['option'] = plus
      ? {
          name: pick(plus.name, locale, copy.plus.name),
          intro: copy.plus.intro({
            name: pick(plus.name, locale, copy.plus.name),
            price: nbsp(formatPrice(plus.price, locale)),
            weeks: weeksLabel(plus.weeks, locale),
          }),
          includes: pickList(plus.includes, locale, copy.plus.includes),
        }
      : undefined;
    columns.push({
      code: 'P5',
      name,
      kind: 'app',
      price: copy.from(nbsp(formatPrice(mvp.price, locale))),
      weeks: weeksLabel(mvp.weeks, locale),
      includes: pickList(mvp.includes, locale, copy.includes.P5),
      forWhom: mvp.forWhom ? datoText(mvp.forWhom[locale]) : null,
      href: '/propuesta?pack=P5',
      requestName: copy.requestName({ name, code: 'P5' }),
      option,
    });
  }
  return columns;
}

export interface ExtraCopy {
  names: Record<string, { label: string; description: string } | undefined>;
  monthly: string;
}

/** Extras on sale, with the page's plain names for the launch ones and the list's own for any other. */
export function extraItems(locale: Locale, copy: ExtraCopy): ExtraItem[] {
  return pricing.extras
    .filter((extra) => extra.active !== false && extra.visible !== false)
    .map((extra): ExtraItem => {
      const own = copy.names[extra.code];
      const label: ReactNode = own?.label ?? datoText(extra.label[locale]);
      const description: ReactNode = own?.description ?? (extra.description ? datoText(extra.description[locale]) : null);
      const suffix = extra.billing === 'monthly' ? copy.monthly : '';
      return { code: extra.code, label, description, price: `${nbsp(formatPrice(extra.price, locale))}${suffix}` };
    });
}
