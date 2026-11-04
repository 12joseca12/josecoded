import "@/lib/security/zod-jitless";

import { z } from "zod";

import type { MessageKey } from "@/i18n/keys.generated";

export const platforms = ["web", "app"] as const;
export type Platform = (typeof platforms)[number];

export const offerSlugs = [
  "web-presencia",
  "web-negocio",
  "web-plataforma",
  "app-primera-version",
  "app-producto",
] as const;
export type OfferSlug = (typeof offerSlugs)[number];

export const extraSlugs = [
  "accounts",
  "admin",
  "payments",
  "languages",
  "seo",
  "analytics",
  "ai",
  "push",
  "offline",
  "stores",
  "maintenance",
  "brand",
] as const;
export type ExtraSlug = (typeof extraSlugs)[number];

export const priceStatuses = ["provisional", "final"] as const;
export const billings = ["once", "monthly", "per_unit"] as const;

const priceText = z.string().regex(/^\d+$/);

export const offerSchema = z
  .strictObject({
    slug: z.enum(offerSlugs),
    platform: z.enum(platforms),
    status: z.enum(priceStatuses),
    from: priceText,
    weeksMin: z.number().int().positive(),
    weeksMax: z.number().int().positive(),
  })
  .refine((offer) => offer.weeksMin <= offer.weeksMax, { message: "weeks range is inverted" })
  .refine((offer) => offer.slug.startsWith(`${offer.platform}-`), {
    message: "slug must start with its platform",
  });

export const extraSchema = z
  .strictObject({
    slug: z.enum(extraSlugs),
    billing: z.enum(billings),
    status: z.enum(priceStatuses),
    from: priceText,
    applies: z.array(z.enum(offerSlugs)).min(1),
    includedIn: z.array(z.enum(offerSlugs)),
  })
  .refine((extra) => extra.includedIn.every((slug) => extra.applies.includes(slug)), {
    message: "an extra can only be included where it applies",
  });

const unique = (list: readonly { slug: string }[]) =>
  new Set(list.map((entry) => entry.slug)).size === list.length;

export const offersSchema = z
  .array(offerSchema)
  .min(1)
  .refine(unique, { message: "offer slugs must be unique" });

export const extrasSchema = z
  .array(extraSchema)
  .min(1)
  .refine(unique, { message: "extra slugs must be unique" });

export type Offer = z.infer<typeof offerSchema>;
export type Extra = z.infer<typeof extraSchema>;

const everywhere: OfferSlug[] = [...offerSlugs];
const onApp: OfferSlug[] = ["app-primera-version", "app-producto"];
const onWeb: OfferSlug[] = ["web-presencia", "web-negocio", "web-plataforma"];

const provisionalPrice = { status: "provisional", from: "000" } as const;

export const offers: readonly Offer[] = offersSchema.parse([
  { slug: "web-presencia", platform: "web", weeksMin: 2, weeksMax: 3, ...provisionalPrice },
  {
    slug: "web-negocio",
    platform: "web",
    weeksMin: 4,
    weeksMax: 6,
    ...provisionalPrice,
  },
  { slug: "web-plataforma", platform: "web", weeksMin: 8, weeksMax: 14, ...provisionalPrice },
  {
    slug: "app-primera-version",
    platform: "app",
    weeksMin: 6,
    weeksMax: 10,
    ...provisionalPrice,
  },
  { slug: "app-producto", platform: "app", weeksMin: 10, weeksMax: 16, ...provisionalPrice },
]);

export const extras: readonly Extra[] = extrasSchema.parse([
  {
    slug: "accounts",
    billing: "once",
    applies: everywhere,
    includedIn: ["web-plataforma", "app-primera-version", "app-producto"],
    ...provisionalPrice,
  },
  {
    slug: "admin",
    billing: "once",
    applies: everywhere,
    includedIn: ["web-negocio", "web-plataforma", "app-producto"],
    ...provisionalPrice,
  },
  { slug: "payments", billing: "once", applies: everywhere, includedIn: [], ...provisionalPrice },
  {
    slug: "languages",
    billing: "per_unit",
    applies: everywhere,
    includedIn: [],
    ...provisionalPrice,
  },
  { slug: "seo", billing: "once", applies: onWeb, includedIn: [], ...provisionalPrice },
  {
    slug: "analytics",
    billing: "once",
    applies: everywhere,
    includedIn: ["web-plataforma", "app-producto"],
    ...provisionalPrice,
  },
  { slug: "ai", billing: "once", applies: everywhere, includedIn: [], ...provisionalPrice },
  {
    slug: "push",
    billing: "once",
    applies: onApp,
    includedIn: ["app-producto"],
    ...provisionalPrice,
  },
  { slug: "offline", billing: "once", applies: onApp, includedIn: [], ...provisionalPrice },
  { slug: "stores", billing: "once", applies: onApp, includedIn: [], ...provisionalPrice },
  {
    slug: "maintenance",
    billing: "monthly",
    applies: everywhere,
    includedIn: [],
    ...provisionalPrice,
  },
  { slug: "brand", billing: "once", applies: everywhere, includedIn: [], ...provisionalPrice },
]);

export interface OfferCopyKeys {
  name: MessageKey;
  audience: MessageKey;
  includes: readonly MessageKey[];
  excludes: readonly MessageKey[];
}

const key = (path: string) => `offersPage.${path}` as MessageKey;

export function offerCopyKeys(slug: OfferSlug): OfferCopyKeys {
  const base = `tiers.${slug}`;
  return {
    name: key(`${base}.name`),
    audience: key(`${base}.audience`),
    includes: ["a", "b", "c", "d"].map((id) => key(`${base}.${id}`)),
    excludes: ["x", "y", "z"].map((id) => key(`${base}.${id}`)),
  };
}

export function extraCopyKeys(slug: ExtraSlug): { name: MessageKey; text: MessageKey } {
  return {
    name: key(`extras.items.${slug}.name`),
    text: key(`extras.items.${slug}.text`),
  };
}

const offerBySlug = new Map(offers.map((offer) => [offer.slug, offer]));
const extraBySlug = new Map(extras.map((extra) => [extra.slug, extra]));

export function offerOf(slug: OfferSlug): Offer {
  const offer = offerBySlug.get(slug);
  if (!offer) throw new Error(`unknown offer ${slug}`);
  return offer;
}

export function extraOf(slug: ExtraSlug): Extra {
  const extra = extraBySlug.get(slug);
  if (!extra) throw new Error(`unknown extra ${slug}`);
  return extra;
}

export function isOfferSlug(value: string): value is OfferSlug {
  return (offerSlugs as readonly string[]).includes(value);
}

export function isExtraSlug(value: string): value is ExtraSlug {
  return (extraSlugs as readonly string[]).includes(value);
}

export function offersOn(platform: Platform, list: readonly Offer[] = offers): Offer[] {
  return list.filter((offer) => offer.platform === platform);
}

export function isProvisional(entry: Offer | Extra): boolean {
  return entry.status === "provisional";
}

export function hasProvisionalOffers(list: readonly Offer[]): boolean {
  return list.some(isProvisional);
}

export function publicOffers(list: readonly Offer[]): Offer[] {
  return list.filter((offer) => !isProvisional(offer));
}

export function lowestOfferFrom(list: readonly Offer[]): string {
  const sorted = [...list].sort((a, b) => Number(a.from) - Number(b.from));
  const first = sorted[0];
  if (!first) throw new Error("lowestOfferFrom needs at least one offer");
  return first.from;
}

export function extraAppliesTo(extra: Extra, chosen: readonly OfferSlug[]): boolean {
  return chosen.some((slug) => extra.applies.includes(slug));
}

export function extraIncludedIn(extra: Extra, chosen: readonly OfferSlug[]): boolean {
  const relevant = chosen.filter((slug) => extra.applies.includes(slug));
  return relevant.length > 0 && relevant.every((slug) => extra.includedIn.includes(slug));
}

export interface Price {
  once: string;
  monthly: string;
  provisional: boolean;
}

export function priceOf(
  chosen: readonly OfferSlug[],
  selected: readonly ExtraSlug[],
  units: Partial<Record<ExtraSlug, number>> = {},
): Price {
  const picked = chosen.map(offerOf);
  const addons = selected.map(extraOf);
  const provisional = [...picked, ...addons].some(isProvisional);
  const once =
    picked.reduce((sum, offer) => sum + Number(offer.from), 0) +
    addons
      .filter((extra) => extra.billing !== "monthly")
      .reduce(
        (sum, extra) =>
          sum + Number(extra.from) * (extra.billing === "per_unit" ? (units[extra.slug] ?? 1) : 1),
        0,
      );
  const monthly = addons
    .filter((extra) => extra.billing === "monthly")
    .reduce((sum, extra) => sum + Number(extra.from), 0);
  const show = (value: number) => (provisional ? "000" : String(value));
  return { once: show(once), monthly: show(monthly), provisional };
}
