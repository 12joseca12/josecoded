import { describe, expect, it } from 'vitest';

import { pricing } from '@josecoded/pricing';

import { diffCatalog } from './diff';

import type { PricingData } from '@josecoded/types';

const clone = (): PricingData => structuredClone(pricing);

describe('diffCatalog', () => {
  it('is empty when the draft is the published catalogue', () => {
    expect(diffCatalog(pricing, clone())).toEqual([]);
  });

  it('reports a moved price with both amounts', () => {
    const draft = clone();
    const p2 = draft.packs.find((pack) => pack.code === 'P2')!;
    const before = p2.price;
    p2.price = before + 100;
    expect(diffCatalog(pricing, draft)).toEqual([
      { section: 'packs', code: 'P2', type: 'changed', fields: ['price'], price: { from: before, to: before + 100 } },
    ]);
  });

  it('names every field that differs and leaves the price out when it did not move', () => {
    const draft = clone();
    const extra = draft.extras[0]!;
    extra.label = { ...extra.label, es: `${extra.label.es} v2` };
    extra.billing = extra.billing === 'monthly' ? 'yearly' : 'monthly';
    const [change] = diffCatalog(pricing, draft);
    expect(change).toMatchObject({ section: 'extras', code: extra.code, type: 'changed', fields: ['label', 'billing'], price: null });
  });

  it('reports an added and a removed item (hidden or deleted items leave the snapshot)', () => {
    const draft = clone();
    const gone = draft.packs.pop()!;
    draft.packs.push({ ...gone, code: 'P9', price: 900 });
    expect(diffCatalog(pricing, draft)).toEqual([
      { section: 'packs', code: 'P9', type: 'added', fields: [], price: { from: null, to: 900 } },
      { section: 'packs', code: gone.code, type: 'removed', fields: [], price: { from: gone.price, to: null } },
    ]);
  });

  it('keeps the mobile app apart and reads a missing active as on sale and a missing forWhom as null', () => {
    const draft = clone();
    const app = draft.apps[0]!;
    const published = clone();
    delete published.apps[0]!.active;
    delete published.apps[0]!.forWhom;
    app.active = true;
    app.forWhom = null;
    expect(diffCatalog(published, draft)).toEqual([]);
    app.active = false;
    expect(diffCatalog(published, draft)).toEqual([{ section: 'apps', code: app.code, type: 'changed', fields: ['active'], price: null }]);
  });

  it('reports the rates as one line each', () => {
    const draft = clone();
    draft.hourly = pricing.hourly + 5;
    expect(diffCatalog(pricing, draft)).toEqual([
      { section: 'rates', code: 'hourly', type: 'changed', fields: ['price'], price: { from: pricing.hourly, to: pricing.hourly + 5 } },
    ]);
  });
});
