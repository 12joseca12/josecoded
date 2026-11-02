import { describe, expect, it } from 'vitest';

import { catalogueFromDraft, publishedKey } from './draft';

import type { DraftRows } from './draft';

const text = (es: string, en = '{{DATO: x}}') => ({ es, en });
const list = (es: string[], en: string[] = ['{{DATO: x}}']) => ({ es, en });
const base = { pricing_version: 'v', deleted_at: null, for_whom: null, includes: list(['a', 'b']), updated_by: null, updated_at: '' };

const rows: DraftRows = {
  packs: [
    { ...base, code: 'P2', kind: 'web', name: text('Corporativa', 'Corporate'), price: 1500, weeks: 4, sort: 2, active: true, visible: true, slug: null },
    { ...base, code: 'P5', kind: 'app', name: text('App'), price: 4000, weeks: 6, sort: 5, active: true, visible: false, slug: null },
    { ...base, code: 'P7', kind: 'web', name: text('Borrado'), price: 1, weeks: 1, sort: 7, active: false, visible: false, slug: null, deleted_at: 'now' },
  ],
  options: [{ ...base, pack_code: 'P5', code: 'plus', name: text('Ampliada'), price: 6000, weeks: 8, visible: true }],
  extras: [{ ...base, code: 'geo', name: text('GEO'), description: null, price: 300, billing: 'monthly', sort: 1, active: true, visible: true }],
  settings: { hourly: 45, feature: 200 },
};

describe('publishedKey', () => {
  it('maps the app and its option to the legacy codes of the file', () => {
    expect(publishedKey({ kind: 'pack', app: true, code: 'P5' })).toEqual({ section: 'apps', code: 'APP_MVP' });
    expect(publishedKey({ kind: 'option', app: true, code: 'plus', pack: 'P5' })).toEqual({ section: 'apps', code: 'APP_PLUS' });
    expect(publishedKey({ kind: 'option', app: true, code: 'pro', pack: 'P8' })).toEqual({ section: 'apps', code: 'P8_PRO' });
    expect(publishedKey({ kind: 'pack', app: false, code: 'P2' })).toEqual({ section: 'packs', code: 'P2' });
  });
});

describe('catalogueFromDraft', () => {
  it('lists live items (hidden ones too), nests options and leaves deleted ones out', () => {
    const catalogue = catalogueFromDraft(rows, []);
    expect(catalogue.packs.map((pack) => pack.code)).toEqual(['P2', 'P5']);
    expect(catalogue.packs[1]).toMatchObject({ visible: false, options: [{ code: 'plus', kind: 'option', price: 6000 }] });
    expect(catalogue).toMatchObject({ hourly: 45, feature: 200 });
  });

  it('shows an English still pending as null and keeps the one that is written', () => {
    const [p2, p5] = catalogueFromDraft(rows, []).packs;
    expect([p2?.name.en, p5?.name.en]).toEqual(['Corporate', null]);
    expect(p2?.includes).toEqual({ es: 'a\nb', en: null });
  });

  it('marks as pending what the diff names, with the published price as «previous»', () => {
    const catalogue = catalogueFromDraft(rows, [
      { section: 'packs', code: 'P2', type: 'changed', fields: ['price'], price: { from: 1400, to: 1500 } },
      { section: 'apps', code: 'APP_PLUS', type: 'added', fields: [], price: { from: null, to: 6000 } },
    ]);
    expect(catalogue.packs[0]).toMatchObject({ pending: true, previous: 1400 });
    expect(catalogue.packs[1]).toMatchObject({ pending: false });
    expect(catalogue.packs[1]?.options[0]).toMatchObject({ pending: true, previous: null });
    expect(catalogue.extras[0]).toMatchObject({ pending: false });
  });
});
