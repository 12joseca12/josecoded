import { pricing } from '@josecoded/pricing';

import { catalogueFromPricing } from '@/lib/pricing/catalogue';

import type { Catalogue, PriceItem } from '@/lib/pricing/catalogue';

const changed = (item: PriceItem, previous: number): PriceItem => ({ ...item, previous, pending: true });

/**
 * The real catalogue of `content/pricing.json` for the dev preview of D2 Precios, with two lines changed in the draft
 * (P2 and «SEO completo») so the screen shows what an unpublished price looks like.
 */
export function previewCatalogue(): Catalogue {
  const published = catalogueFromPricing(pricing);
  return {
    ...published,
    packs: published.packs.map((pack) => (pack.code === 'P2' ? { ...changed(pack, 1200), app: pack.app, options: pack.options } : pack)),
    extras: published.extras.map((extra) => (extra.code === 'seo_full' ? changed(extra, 450) : extra)),
  };
}
