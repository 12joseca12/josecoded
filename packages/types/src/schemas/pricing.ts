import { z } from 'zod';

// Schema of packages/pricing/pricing.json (generated from Comercial/tarifas.md).
// Contract: working-agreements §14.2; plan task 1.4 (v2.1: bilingual texts).

export const PACK_CODES = ['P1', 'P2', 'P3', 'P4'] as const;
export const APP_CODES = ['APP_MVP', 'APP_PLUS'] as const;
export const EXTRA_CODES = [
  'seo_basic',
  'seo_full',
  'geo',
  'security_audit',
  'maintenance_basic',
  'maintenance_extended',
] as const;

export const packCodeSchema = z.enum(PACK_CODES);
export const appCodeSchema = z.enum(APP_CODES);
export const extraCodeSchema = z.enum(EXTRA_CODES);

/** A text that exists in both languages. A `{{DATO: …}}` marker counts as pending, not empty. */
export const localizedTextSchema = z.object({ es: z.string().min(1), en: z.string().min(1) });
export const localizedListSchema = z.object({
  es: z.array(z.string().min(1)).min(1),
  en: z.array(z.string().min(1)).min(1),
});

const offerShape = {
  name: localizedTextSchema,
  price: z.number().int().positive(),
  weeks: z.number().int().positive(),
  includes: localizedListSchema,
  forWhom: localizedTextSchema,
};

export const packSchema = z.object({ code: packCodeSchema, ...offerShape });
export const appPackSchema = z.object({ code: appCodeSchema, ...offerShape });

export const extraSchema = z.object({
  code: extraCodeSchema,
  label: localizedTextSchema,
  description: localizedTextSchema,
  price: z.number().int().positive(),
  billing: z.enum(['one_off', 'monthly']),
});

const percentRule = z.object({ percent: z.number().positive().max(100) });

export const pricingSchema = z
  .object({
    version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hourly: z.number().positive(),
    feature: z.number().positive(),
    packs: z.array(packSchema),
    apps: z.array(appPackSchema),
    extras: z.array(extraSchema),
    upgradeRule: z.literal('list_difference'),
    affiliate: z.object({
      client: z.object({ maintenanceMonths: z.number().int().positive() }),
      standard: percentRule,
      premium: percentRule,
      base: z.literal('first_order_ex_vat'),
    }),
  })
  .superRefine((value, ctx) => {
    const expectCodes = (path: string, got: string[], want: readonly string[]) => {
      if ([...got].sort().join() !== [...want].sort().join()) {
        ctx.addIssue({
          code: 'custom',
          path: [path],
          message: `expected exactly ${want.join(', ')}`,
        });
      }
    };
    expectCodes(
      'packs',
      value.packs.map((p) => p.code),
      PACK_CODES,
    );
    expectCodes(
      'apps',
      value.apps.map((a) => a.code),
      APP_CODES,
    );
    expectCodes(
      'extras',
      value.extras.map((e) => e.code),
      EXTRA_CODES,
    );
  });
