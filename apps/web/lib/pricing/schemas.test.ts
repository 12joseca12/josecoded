import { describe, expect, it } from 'vitest';

import { extraInputSchema, packInputSchema, packOptionInputSchema } from '@josecoded/types';

import { deleteFormSchema, extraFormSchema, optionFormSchema, packFormSchema, settingsFormSchema } from './schemas';

const pack = {
  mode: 'create',
  code: 'P6',
  name_es: 'Landing',
  includes_es: 'Diseño\nTextos\n',
  price: '1400',
  weeks: '3',
  on_sale: 'on',
};

describe('packFormSchema', () => {
  it('turns the form into the payload of admin_pricing_set_pack, which the RPC input schema accepts', () => {
    const { payload } = packFormSchema.parse(pack);
    expect(payload).toMatchObject({ code: 'P6', price: 1400, weeks: 3, active: true, visible: false, for_whom: null });
    expect(payload.includes.es).toEqual(['Diseño', 'Textos']);
    expect(packInputSchema.safeParse({ ...payload, for_whom: undefined }).success).toBe(true);
  });

  it('writes the {{DATO}} marker for an English text still to be written', () => {
    const { payload } = packFormSchema.parse(pack);
    expect(payload.name).toEqual({ es: 'Landing', en: '{{DATO: pack P6 name (en)}}' });
    expect(payload.includes.en).toEqual(['{{DATO: pack P6 includes (en)}}']);
    expect(packFormSchema.parse({ ...pack, name_en: 'Landing page', for_whom_es: 'Autónomos' }).payload.for_whom).toEqual({
      es: 'Autónomos',
      en: '{{DATO: pack P6 forWhom (en)}}',
    });
  });

  it.each([
    ['a lowercase code', { code: 'p6' }],
    ['a code that starts with a digit', { code: '6P' }],
    ['a price of 0 (the published file refuses it)', { price: '0' }],
    ['a decimal price', { price: '10.5' }],
    ['a negative price', { price: '-3' }],
    ['a price over the bound', { price: '1000000' }],
    ['0 weeks', { weeks: '0' }],
    ['more than 104 weeks', { weeks: '105' }],
    ['an empty Spanish name', { name_es: '  ' }],
    ['a name over 120 characters', { name_es: 'x'.repeat(121) }],
    ['no included point', { includes_es: '\n \n' }],
    ['more than 12 points', { includes_es: Array.from({ length: 13 }, (_, i) => `p${i}`).join('\n') }],
    ['an unknown mode', { mode: 'upsert' }],
  ])('refuses %s', (_label, change) => {
    expect(packFormSchema.safeParse({ ...pack, ...change }).success).toBe(false);
  });
});

describe('optionFormSchema', () => {
  const option = { mode: 'create', pack: 'P5', code: 'plus', name_es: 'Ampliada', includes_es: 'Push', price: '6000', weeks: '8' };

  it('needs the pack and a lowercase code', () => {
    const parsed = optionFormSchema.parse(option);
    expect(parsed).toMatchObject({ pack: 'P5', code: 'plus' });
    expect(packOptionInputSchema.safeParse({ ...parsed.payload, for_whom: undefined }).success).toBe(true);
    expect(optionFormSchema.safeParse({ ...option, code: 'Plus' }).success).toBe(false);
    expect(optionFormSchema.safeParse({ ...option, pack: undefined }).success).toBe(false);
  });
});

describe('extraFormSchema', () => {
  const extra = { mode: 'edit', code: 'seo_full', name_es: 'SEO completo', price: '500', billing: 'one_off', visible: 'on' };

  it('accepts a description left empty and refuses a one-letter code or an unknown billing', () => {
    const { payload } = extraFormSchema.parse(extra);
    expect(payload).toMatchObject({ code: 'seo_full', price: 500, billing: 'one_off', description: null, visible: true });
    expect(extraInputSchema.safeParse({ ...payload, description: undefined }).success).toBe(true);
    expect(extraFormSchema.safeParse({ ...extra, code: 'a' }).success).toBe(false);
    expect(extraFormSchema.safeParse({ ...extra, billing: 'weekly' }).success).toBe(false);
  });
});

describe('deleteFormSchema and settingsFormSchema', () => {
  it('takes a pack, an extra or an option as PACK:option', () => {
    expect(deleteFormSchema.safeParse({ kind: 'pack_option', code: 'P5:plus' }).success).toBe(true);
    expect(deleteFormSchema.safeParse({ kind: 'settings', code: 'hourly' }).success).toBe(false);
    expect(deleteFormSchema.safeParse({ kind: 'pack', code: "P1'; drop" }).success).toBe(false);
  });

  it('keeps the rates above 0 and inside the bounds of the RPC input', () => {
    expect(settingsFormSchema.parse({ hourly: '45', feature: '200' })).toEqual({ hourly: 45, feature: 200 });
    expect(settingsFormSchema.safeParse({ hourly: '0', feature: '200' }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ hourly: '10001', feature: '200' }).success).toBe(false);
  });
});
