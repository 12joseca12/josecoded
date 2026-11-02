import { z } from 'zod';

import { EXTRA_CODE_RE, OPTION_CODE_RE, PACK_CODE_RE } from '@josecoded/types';

// Input of the Server Actions of D2 Precios (block B40). Every field arrives as text from a form: zod is the border
// and the payloads of the RPCs are inferred from it. The bounds repeat the database and the file it ends up in
// (`pricingSchema`: price and weeks are positive integers, both languages present): the RPCs check them again.

export const MAX_PRICE = 999_999;
export const MAX_WEEKS = 104;
export const MAX_HOURLY = 10_000;
export const MAX_FEATURE = 100_000;

/** Whole euros without VAT, at least 1 (the published file refuses 0). */
const whole = (max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,6}$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max));

const textField = (max: number) => z.string().trim().max(max);
const present = z.string().optional().transform((value) => value !== undefined);

/** A text still to be written in English is the `{{DATO}}` marker the site already knows (it then shows the Spanish). */
export const pendingText = (what: string) => `{{DATO: ${what}}}`;

const lines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/** A text in both languages: Spanish decides, an empty English one becomes the marker. */
function localized(es: string, en: string, what: string) {
  return { es, en: en || pendingText(`${what} (en)`) };
}
function localizedLines(es: string, en: string, what: string) {
  const spanish = lines(es);
  const english = lines(en);
  return { es: spanish, en: english.length > 0 ? english : [pendingText(`${what} (en)`)] };
}
function optionalLocalized(es: string, en: string, what: string) {
  return es || en ? localized(es || pendingText(`${what} (es)`), en, what) : null;
}

const texts = {
  name_es: textField(120).min(1),
  name_en: textField(120).default(''),
  includes_es: textField(600).refine((value) => lines(value).length >= 1 && lines(value).length <= 12),
  includes_en: textField(600).default(''),
  for_whom_es: textField(200).default(''),
  for_whom_en: textField(200).default(''),
};
const mode = z.enum(['create', 'edit']);

export const packFormSchema = z
  .object({
    mode,
    code: z.string().regex(PACK_CODE_RE),
    ...texts,
    price: whole(MAX_PRICE),
    weeks: whole(MAX_WEEKS),
    on_sale: present,
    visible: present,
  })
  .transform((v) => ({
    mode: v.mode,
    code: v.code,
    payload: {
      code: v.code,
      name: localized(v.name_es, v.name_en, `pack ${v.code} name`),
      includes: localizedLines(v.includes_es, v.includes_en, `pack ${v.code} includes`),
      for_whom: optionalLocalized(v.for_whom_es, v.for_whom_en, `pack ${v.code} forWhom`),
      price: v.price,
      weeks: v.weeks,
      active: v.on_sale,
      visible: v.visible,
    },
  }));

export const optionFormSchema = z
  .object({
    mode,
    pack: z.string().regex(PACK_CODE_RE),
    code: z.string().regex(OPTION_CODE_RE),
    ...texts,
    price: whole(MAX_PRICE),
    weeks: whole(MAX_WEEKS),
    visible: present,
  })
  .transform((v) => ({
    mode: v.mode,
    pack: v.pack,
    code: v.code,
    payload: {
      code: v.code,
      name: localized(v.name_es, v.name_en, `option ${v.pack}:${v.code} name`),
      includes: localizedLines(v.includes_es, v.includes_en, `option ${v.pack}:${v.code} includes`),
      for_whom: optionalLocalized(v.for_whom_es, v.for_whom_en, `option ${v.pack}:${v.code} forWhom`),
      price: v.price,
      weeks: v.weeks,
      visible: v.visible,
    },
  }));

export const extraFormSchema = z
  .object({
    mode,
    code: z.string().regex(EXTRA_CODE_RE),
    name_es: texts.name_es,
    name_en: texts.name_en,
    includes_es: textField(600).default(''),
    includes_en: textField(600).default(''),
    price: whole(MAX_PRICE),
    billing: z.enum(['one_off', 'monthly', 'yearly']),
    visible: present,
  })
  .transform((v) => ({
    mode: v.mode,
    code: v.code,
    payload: {
      code: v.code,
      name: localized(v.name_es, v.name_en, `extra ${v.code} label`),
      description: optionalLocalized(v.includes_es, v.includes_en, `extra ${v.code} description`),
      price: v.price,
      billing: v.billing,
      visible: v.visible,
    },
  }));

export const deleteFormSchema = z.object({
  kind: z.enum(['pack', 'pack_option', 'extra']),
  /** `P5:plus` for an option. */
  code: z.string().regex(/^[A-Za-z0-9_]{1,32}(:[a-z][a-z0-9_]{0,31})?$/),
});

export const settingsFormSchema = z.object({ hourly: whole(MAX_HOURLY), feature: whole(MAX_FEATURE) });
