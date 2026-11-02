import { hasDato } from '@/lib/content/dato';

import type { PricingData } from '@josecoded/types';

/** Euros as the site writes them: whole when they are whole («1.400 €»), cents only when there are some. */
export const PRICE_FORMAT = { style: 'currency', currency: 'EUR', useGrouping: 'always', minimumFractionDigits: 0 } as const;

export const PRICING_PATH = '/admin/contenido?tab=precios';

export type PriceItemKind = 'pack' | 'option' | 'extra';
export type PriceBilling = 'one_off' | 'monthly' | 'yearly';

/** A text in both languages; `en` is `null` while the English one is still a `{{DATO}}` (the site then shows the Spanish). */
export interface PriceText {
  es: string;
  en: string | null;
}

/** One line of the catalogue as D2 Precios shows it: a pack, the option inside a pack, or an extra. */
export interface PriceItem {
  kind: PriceItemKind;
  code: string;
  name: PriceText;
  /** What the pack includes, one point per line; the description of an extra. */
  includes: PriceText;
  forWhom: PriceText | null;
  /** List price without VAT, in euros. */
  price: number;
  /** The published price when the draft changed it. */
  previous: number | null;
  weeks: number | null;
  billing: PriceBilling | null;
  onSale: boolean;
  visible: boolean;
  /** Changed in the draft and not published yet. */
  pending: boolean;
}

export interface PricePack extends PriceItem {
  options: readonly PriceItem[];
}

export interface Catalogue {
  packs: readonly PricePack[];
  extras: readonly PriceItem[];
  hourly: number;
  feature: number;
}

type Localized = { es: string; en: string };
type LocalizedList = { es: string[]; en: string[] };

const text = (value: Localized): PriceText => ({
  es: hasDato(value.es) ? value.es : '',
  en: hasDato(value.en) ? value.en : null,
});
const optional = (value: Localized | null | undefined): PriceText | null => (value ? text(value) : null);
const lines = (value: LocalizedList): PriceText => text({ es: value.es.join('\n'), en: value.en.join('\n') });

type RawPack = PricingData['packs'][number] | PricingData['apps'][number];

function packItem(pack: RawPack, kind: 'pack' | 'option'): PriceItem {
  return {
    kind,
    code: pack.code,
    name: text(pack.name),
    includes: lines(pack.includes),
    forWhom: optional(pack.forWhom),
    price: pack.price,
    previous: null,
    weeks: pack.weeks,
    billing: null,
    onSale: pack.active ?? true,
    visible: true,
    pending: false,
  };
}

/**
 * The published catalogue (`content/pricing.json`) as rows of D2. The draft (what the admin changed and has not
 * published) arrives with B40; until then everything here is published, and every item is visible.
 */
export function catalogueFromPricing(data: PricingData): Catalogue {
  const [app, plus] = data.apps;
  const packs: PricePack[] = data.packs.map((pack) => ({ ...packItem(pack, 'pack'), options: [] }));
  if (app) packs.push({ ...packItem(app, 'pack'), options: plus ? [packItem(plus, 'option')] : [] });
  return {
    packs,
    extras: data.extras.map((extra) => ({
      kind: 'extra',
      code: extra.code,
      name: text(extra.label),
      includes: optional(extra.description) ?? { es: '', en: null },
      forWhom: null,
      price: extra.price,
      previous: null,
      weeks: null,
      billing: extra.billing,
      onSale: extra.active ?? true,
      visible: true,
      pending: false,
    })),
    hourly: data.hourly,
    feature: data.feature,
  };
}

export function pendingCount(catalogue: Catalogue): number {
  const items = [...catalogue.packs.flatMap((pack) => [pack, ...pack.options]), ...catalogue.extras];
  return items.filter((item) => item.pending).length;
}
