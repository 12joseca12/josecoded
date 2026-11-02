import { z } from 'zod';

// Schema of content/pricing.json, the published price catalogue (D54: the admin edits it in Supabase, the gateway's
// bot commits it). Contract: working-agreements §14.2; plan tasks 1.4 and 3.1c (v3.4: codes are dynamic, the version
// is `YYYY-MM-DD` or `YYYY-MM-DD.n`, and the snapshot of `pricing_catalog_snapshot()` carries `active`).

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

// Closed lists: the launch catalogue, and what the AI proposal can choose from (schemas/proposals.ts).
export const packCodeSchema = z.enum(PACK_CODES);
export const appCodeSchema = z.enum(APP_CODES);
export const extraCodeSchema = z.enum(EXTRA_CODES);

/** `packs.code` and `extras.code` checks of the database; the admin can create `P6`, `LANDING` or `copywriting`. */
export const PACK_CODE_RE = /^[A-Z][A-Z0-9_]{1,15}$/;
export const EXTRA_CODE_RE = /^[a-z][a-z0-9_]{1,31}$/;
export const OPTION_CODE_RE = /^[a-z][a-z0-9_]{0,31}$/;
/** An `apps` entry of the snapshot: `APP_MVP`, `APP_PLUS`, or `<PACK>_<OPTION>` of a pack the admin created. */
export const APP_ENTRY_CODE_RE = /^[A-Z][A-Z0-9_]{1,63}$/;

// The catalogue the file carries: any code that the database accepts. The inferred type keeps the launch codes for
// autocompletion without closing the set.
const catalogPackCode = z.string().regex(PACK_CODE_RE) as z.ZodType<PackCodeLoose>;
const catalogAppCode = z.string().regex(APP_ENTRY_CODE_RE) as z.ZodType<AppCodeLoose>;
const catalogExtraCode = z.string().regex(EXTRA_CODE_RE) as z.ZodType<ExtraCodeLoose>;
type PackCodeLoose = (typeof PACK_CODES)[number] | (string & {});
type AppCodeLoose = (typeof APP_CODES)[number] | (string & {});
type ExtraCodeLoose = (typeof EXTRA_CODES)[number] | (string & {});

/** A text that exists in both languages. A `{{DATO: …}}` marker counts as pending, not empty. */
export const localizedTextSchema = z.object({ es: z.string().min(1), en: z.string().min(1) });
export const localizedListSchema = z.object({
  es: z.array(z.string().min(1)).min(1),
  en: z.array(z.string().min(1)).min(1),
});

// `active` (on sale) and `visible` are optional: the snapshot of the database carries `active` (it lists only the visible
// items), and the file as it was before D54 had neither, which counts as on sale. `forWhom` and `description` are
// optional in the admin.
const offerShape = {
  name: localizedTextSchema,
  price: z.number().int().positive(),
  weeks: z.number().int().positive(),
  includes: localizedListSchema,
  forWhom: localizedTextSchema.nullish(),
  active: z.boolean().optional(),
  visible: z.boolean().optional(),
};

export const packSchema = z.object({ code: catalogPackCode, ...offerShape });
export const appPackSchema = z.object({ code: catalogAppCode, ...offerShape });

export const extraSchema = z.object({
  code: catalogExtraCode,
  label: localizedTextSchema,
  description: localizedTextSchema.nullish(),
  price: z.number().int().positive(),
  billing: z.enum(['one_off', 'monthly', 'yearly']),
  active: z.boolean().optional(),
  visible: z.boolean().optional(),
});

/** Two entries never share a code (the file is read by code). */
function uniqueCodes(items: { code: string }[]): boolean {
  return new Set(items.map((i) => i.code)).size === items.length;
}

const percentRule = z.object({ percent: z.number().positive().max(100) });

export const pricingSchema = z
  .object({
    version: z.string().regex(/^\d{4}-\d{2}-\d{2}(\.\d+)?$/),
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
    for (const key of ['packs', 'apps', 'extras'] as const) {
      if (!uniqueCodes(value[key])) ctx.addIssue({ code: 'custom', path: [key], message: 'duplicate codes' });
    }
  });
