import "@/lib/security/zod-jitless";

import { z } from "zod";

const money = z.number().min(0).lt(10_000_000).nullable();

export const publicOfferRowSchema = z.object({
  slug: z.string(),
  price: money,
  weeks_min: z.number().int().positive(),
  weeks_max: z.number().int().positive(),
  sort: z.number().int(),
});

export const publicExtraRowSchema = z.object({
  slug: z.string(),
  price: money,
  sort: z.number().int(),
});

export const publicRateRowSchema = z.object({
  code: z.string(),
  price: money,
});

export const publicPlanRowSchema = z.object({
  slug: z.string(),
  price_monthly: money,
  sort: z.number().int(),
});

export const catalogRowsSchema = z.strictObject({
  offers: z.array(publicOfferRowSchema),
  extras: z.array(publicExtraRowSchema),
  rates: z.array(publicRateRowSchema),
  plans: z.array(publicPlanRowSchema),
});

export type CatalogRows = z.infer<typeof catalogRowsSchema>;

export const planSizes = ["S", "M", "L"] as const;
export type PlanSize = (typeof planSizes)[number];
