import {
  type Extra,
  extras as codeExtras,
  type ExtraSlug,
  type Offer,
  offers as codeOffers,
} from "@/lib/services/offers";
import { type Rates, rates as codeRates } from "@/lib/services/rates";
import type { CatalogRows, PlanSize } from "@/types/catalog";
import { planSizes } from "@/types/catalog";

export interface Catalog {
  offers: readonly Offer[];
  extras: readonly Extra[];
  rates: Rates;
  plans: Record<PlanSize, string | null>;
  hiddenExtras: readonly ExtraSlug[];
}

export function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export const codeCatalog: Catalog = {
  offers: codeOffers,
  extras: codeExtras,
  rates: codeRates,
  plans: { S: null, M: null, L: null },
  hiddenExtras: [],
};

function priced<T extends Offer | Extra>(entry: T, price: number | null | undefined): T {
  if (price === null || price === undefined) return entry;
  return { ...entry, status: "final", from: formatAmount(price) };
}

export function mergeCatalog(rows: CatalogRows | null): Catalog {
  if (rows === null) return codeCatalog;

  const offers = codeOffers.map((offer) => {
    const row = rows.offers.find((entry) => entry.slug === offer.slug);
    if (!row || row.weeks_min > row.weeks_max) return offer;
    return priced({ ...offer, weeksMin: row.weeks_min, weeksMax: row.weeks_max }, row.price);
  });

  const plans: Record<PlanSize, string | null> = { S: null, M: null, L: null };
  for (const size of planSizes) {
    const row = rows.plans.find((entry) => entry.slug === size.toLowerCase());
    plans[size] = row?.price_monthly == null ? null : formatAmount(row.price_monthly);
  }
  const monthlyPrices = rows.plans
    .map((row) => row.price_monthly)
    .filter((price): price is number => price !== null);
  const cheapestPlan = monthlyPrices.length > 0 ? Math.min(...monthlyPrices) : null;

  const visibleSlugs = new Set(rows.extras.map((entry) => entry.slug));
  const priceOfExtra = (extra: Extra) => {
    if (extra.slug === "maintenance") return priced(extra, cheapestPlan);
    return priced(extra, rows.extras.find((entry) => entry.slug === extra.slug)?.price);
  };
  const dbOrder = [...rows.extras]
    .sort((a, b) => a.sort - b.sort)
    .map((row) => codeExtras.find((extra) => extra.slug === row.slug))
    .filter((extra): extra is Extra => extra !== undefined);
  let next = 0;
  const extras = codeExtras.map((extra) => {
    if (!visibleSlugs.has(extra.slug)) return priceOfExtra(extra);
    const ordered = dbOrder[next++];
    return priceOfExtra(ordered ?? extra);
  });
  const hiddenExtras = rows.extras.length
    ? codeExtras
        .filter((extra) => extra.slug !== "maintenance" && !visibleSlugs.has(extra.slug))
        .map((extra) => extra.slug)
    : [];

  const hourly = rows.rates.find((entry) => entry.code === "hourly")?.price ?? null;
  const task = rows.rates.find((entry) => entry.code === "task_min")?.price ?? null;
  const rates: Rates =
    hourly !== null && task !== null
      ? { status: "final", hour: formatAmount(hourly), task: formatAmount(task) }
      : codeRates;

  return { offers, extras, rates, plans, hiddenExtras };
}
