import { z } from 'zod';

import { EXTRA_CODE_RE, localizedListSchema, localizedTextSchema, OPTION_CODE_RE, PACK_CODE_RE } from './pricing.ts';

// Inputs of the admin RPCs of the price catalogue (task 1.8e, DATOS v1.4 §14.12.3, Q23/D54): `admin_pricing_set_pack`,
// `admin_pricing_set_option`, `admin_pricing_set_extra`, `admin_pricing_set_settings`. A key that is absent keeps the
// current value; creating needs name and price. Prices are whole euros.

export const PACK_KINDS = ['web', 'app'] as const;
export const EXTRA_BILLINGS = ['one_off', 'monthly', 'yearly'] as const;
export const PRICING_ITEMS = ['pack', 'pack_option', 'extra', 'settings'] as const;


const price = z.number().int().positive().max(1_000_000);
const weeks = z.number().int().positive().max(104);
const sort = z.number().int().min(0).max(32_767);

export const packInputSchema = z.object({
  code: z.string().regex(PACK_CODE_RE),
  kind: z.enum(PACK_KINDS).optional(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  name: localizedTextSchema.optional(),
  includes: localizedListSchema.optional(),
  for_whom: localizedTextSchema.optional(),
  price: price.optional(),
  weeks: weeks.optional(),
  sort: sort.optional(),
  active: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const packOptionInputSchema = z.object({
  code: z.string().regex(OPTION_CODE_RE),
  name: localizedTextSchema.optional(),
  price: price.optional(),
  weeks: weeks.optional(),
  includes: localizedListSchema.optional(),
  for_whom: localizedTextSchema.optional(),
  visible: z.boolean().optional(),
});

export const extraInputSchema = z.object({
  code: z.string().regex(EXTRA_CODE_RE),
  name: localizedTextSchema.optional(),
  description: localizedTextSchema.optional(),
  price: price.optional(),
  billing: z.enum(EXTRA_BILLINGS).optional(),
  sort: sort.optional(),
  active: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const pricingSettingsInputSchema = z.object({
  hourly: z.number().int().positive().max(10_000),
  feature: z.number().int().positive().max(100_000),
});
