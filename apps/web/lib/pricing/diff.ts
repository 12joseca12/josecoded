import type { PricingData } from '@josecoded/types';

export type CatalogSection = 'packs' | 'apps' | 'extras' | 'rates';
export type CatalogChangeType = 'added' | 'removed' | 'changed';

/** One line of the publish sheet: what differs between the published catalogue and the draft. */
export interface CatalogChange {
  section: CatalogSection;
  code: string;
  type: CatalogChangeType;
  /** Fields that differ (`changed` only), named as in `content/pricing.json`. */
  fields: readonly string[];
  /** Present when the price (or the rate) moved; for `added` only `to`, for `removed` only `from`. */
  price: { from: number | null; to: number | null } | null;
}

type Offer = PricingData['packs'][number];
type Extra = PricingData['extras'][number];

const OFFER_FIELDS = ['name', 'price', 'weeks', 'includes', 'forWhom', 'active'] as const;
const EXTRA_FIELDS = ['label', 'description', 'price', 'billing', 'active'] as const;

// A missing `active` counts as on sale and a missing `forWhom` / `description` as null: the file as it was before D54
// carried neither, and the database snapshot always writes them. Both sides are normalised before comparing.
const norm = (value: unknown): string => JSON.stringify(value ?? null);
const offerValue = (item: Offer, field: (typeof OFFER_FIELDS)[number]) => (field === 'active' ? (item.active ?? true) : item[field]);
const extraValue = (item: Extra, field: (typeof EXTRA_FIELDS)[number]) => (field === 'active' ? (item.active ?? true) : item[field]);

function diffList<T extends { code: string; price: number }>(
  section: CatalogSection,
  published: readonly T[],
  draft: readonly T[],
  differing: (before: T, after: T) => string[],
): CatalogChange[] {
  const before = new Map(published.map((item) => [item.code, item]));
  const after = new Map(draft.map((item) => [item.code, item]));
  const changes: CatalogChange[] = [];
  for (const item of draft) {
    const old = before.get(item.code);
    if (!old) {
      changes.push({ section, code: item.code, type: 'added', fields: [], price: { from: null, to: item.price } });
      continue;
    }
    const fields = differing(old, item);
    if (fields.length > 0) {
      const price = old.price === item.price ? null : { from: old.price, to: item.price };
      changes.push({ section, code: item.code, type: 'changed', fields, price });
    }
  }
  for (const item of published) {
    if (!after.has(item.code)) changes.push({ section, code: item.code, type: 'removed', fields: [], price: { from: item.price, to: null } });
  }
  return changes;
}

/**
 * What publishing would change: the published catalogue (`content/pricing.json`) against the draft (the snapshot of
 * the database). Pure and symmetric in nothing: «added» is in the draft only, «removed» (hidden or deleted there) in
 * the published one only. The version and the affiliate rules are not edited from the admin and are not compared.
 */
export function diffCatalog(published: PricingData, draft: PricingData): CatalogChange[] {
  const offers = (section: 'packs' | 'apps') =>
    diffList(section, published[section], draft[section], (a, b) => OFFER_FIELDS.filter((f) => norm(offerValue(a, f)) !== norm(offerValue(b, f))));
  const rates: CatalogChange[] = (['hourly', 'feature'] as const)
    .filter((key) => published[key] !== draft[key])
    .map((key) => ({ section: 'rates', code: key, type: 'changed', fields: ['price'], price: { from: published[key], to: draft[key] } }));
  return [
    ...offers('packs'),
    ...offers('apps'),
    ...diffList('extras', published.extras, draft.extras, (a, b) => EXTRA_FIELDS.filter((f) => norm(extraValue(a, f)) !== norm(extraValue(b, f)))),
    ...rates,
  ];
}
