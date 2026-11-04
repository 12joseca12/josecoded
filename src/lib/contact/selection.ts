import {
  type ExtraSlug,
  extraAppliesTo,
  extraOf,
  extraSlugs,
  isExtraSlug,
  isOfferSlug,
  offerOf,
  type OfferSlug,
  offerSlugs,
  type Platform,
  priceOf,
} from "@/lib/services/offers";

export interface OfferSelection {
  offers: OfferSlug[];
  extras: ExtraSlug[];
}

type Param = string | string[] | undefined;

const legacyOffers: Record<string, OfferSlug[]> = {
  "app-movil": ["app-primera-version"],
  "web-negocio": ["web-negocio"],
  "web-y-app": ["web-negocio", "app-primera-version"],
};

function words(value: Param): string[] {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return list.flatMap((entry) => entry.split(",")).map((entry) => entry.trim());
}

function onePerPlatform(slugs: OfferSlug[]): OfferSlug[] {
  const seen = new Set<Platform>();
  const kept: OfferSlug[] = [];
  for (const slug of slugs) {
    const { platform } = offerOf(slug);
    if (seen.has(platform)) continue;
    seen.add(platform);
    kept.push(slug);
  }
  return offerSlugs.filter((slug) => kept.includes(slug));
}

export function parseSelection(query: {
  offer?: Param;
  extras?: Param;
  pack?: Param;
}): OfferSelection | null {
  const requested = words(query.offer).filter(isOfferSlug);
  const legacy = words(query.pack).flatMap((entry) => legacyOffers[entry] ?? []);
  const offers = onePerPlatform(requested.length > 0 ? requested : legacy);
  const wanted = words(query.extras).filter(isExtraSlug);
  const extras = extraSlugs.filter(
    (slug) =>
      wanted.includes(slug) && (offers.length === 0 || extraAppliesTo(extraOf(slug), offers)),
  );
  if (offers.length === 0 && extras.length === 0) return null;
  return { offers, extras };
}

export function selectionParams(selection: OfferSelection): URLSearchParams {
  const params = new URLSearchParams();
  if (selection.offers.length > 0) params.set("offer", selection.offers.join(","));
  if (selection.extras.length > 0) params.set("extras", selection.extras.join(","));
  return params;
}

export function selectionPath(selection: OfferSelection): string {
  const query = selectionParams(selection).toString().replaceAll("%2C", ",");
  return query === "" ? "" : `?${query}`;
}
