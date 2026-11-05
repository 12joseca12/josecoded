import { extraIncludedIn, extraOf, type ExtraSlug, type OfferSlug } from "./offers";

export const priceDriverSlugs = [
  "accounts",
  "payments",
  "languages",
] as const satisfies readonly ExtraSlug[];
export type PriceDriverSlug = (typeof priceDriverSlugs)[number];

export function priceDriversFor(slug: OfferSlug): PriceDriverSlug[] {
  return priceDriverSlugs.filter((driver) => !extraIncludedIn(extraOf(driver), [slug]));
}
