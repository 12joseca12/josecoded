// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  role: 'admin' as 'admin' | 'closer',
  existing: true,
  rpc: vi.fn(),
  guard: vi.fn(),
  lookups: [] as unknown[][],
}));

// from(table).select('code').eq(...)[.eq(...)].maybeSingle()
const lookup = (table: string) => {
  const chain = {
    select: () => chain,
    eq: (...args: unknown[]) => (db.lookups.push([table, ...args]), chain),
    maybeSingle: async () => ({ data: db.existing ? { code: 'x' } : null, error: null }),
  };
  return chain;
};
const supabase = { from: lookup, rpc: (...args: unknown[]) => db.rpc(...args) };

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: async () => {
    db.guard();
    if (db.role !== 'admin') throw new Error('NOT_FOUND');
    return { user: { id: 'admin' }, supabase };
  },
}));

import { deletePriceItem, restorePriceItem, saveExtra, saveOption, savePack, saveSettings } from './actions';

const idle = { status: 'idle' } as const;
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set('locale', 'es');
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const pack = { mode: 'create', code: 'P6', name_es: 'Landing', includes_es: 'Diseño', price: '1400', weeks: '3', visible: 'on' };
const option = { mode: 'create', pack: 'P5', code: 'plus', name_es: 'Ampliada', includes_es: 'Push', price: '6000', weeks: '8' };
const extra = { mode: 'create', code: 'copywriting', name_es: 'Textos', price: '300', billing: 'one_off' };

beforeEach(() => {
  db.role = 'admin';
  db.existing = false;
  db.lookups = [];
  db.guard.mockReset();
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: null, error: null });
});

describe('every action', () => {
  it('asks for the admin before anything else: a closer gets the 404 and nothing is read or written', async () => {
    db.role = 'closer';
    const calls = [
      savePack(idle, form(pack)),
      saveOption(idle, form(option)),
      saveExtra(idle, form(extra)),
      deletePriceItem(idle, form({ kind: 'pack', code: 'P1' })),
      restorePriceItem(idle, form({ kind: 'pack', code: 'P1' })),
      saveSettings(idle, form({ hourly: '45', feature: '200' })),
    ];
    for (const call of calls) await expect(call).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.lookups).toEqual([]);
  });
});

describe('savePack, saveOption and saveExtra', () => {
  it('creates a pack through admin_pricing_set_pack with the validated payload', async () => {
    await expect(savePack(idle, form(pack))).resolves.toEqual({ status: 'ok' });
    expect(db.lookups).toEqual([['packs', 'code', 'P6']]);
    expect(db.rpc).toHaveBeenCalledWith('admin_pricing_set_pack', {
      p: expect.objectContaining({ code: 'P6', price: 1400, weeks: 3, visible: true, name: { es: 'Landing', en: '{{DATO: pack P6 name (en)}}' } }),
    });
  });

  it('refuses to create over an existing code (the RPC upserts) and to edit one that does not exist', async () => {
    db.existing = true;
    const taken = await savePack(idle, form(pack));
    expect(taken).toMatchObject({ status: 'error', fieldErrors: { code: 'adminPricing.errors.codeTaken' } });
    db.existing = false;
    const missing = await savePack(idle, form({ ...pack, mode: 'edit' }));
    expect(missing).toMatchObject({ status: 'error', formError: 'adminPricing.errors.notFound' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('edits an existing pack and looks the option up by pack and code', async () => {
    db.existing = true;
    await expect(saveOption(idle, form({ ...option, mode: 'edit' }))).resolves.toEqual({ status: 'ok' });
    expect(db.lookups).toEqual([['pack_options', 'pack_code', 'P5'], ['pack_options', 'code', 'plus']]);
    expect(db.rpc).toHaveBeenCalledWith('admin_pricing_set_option', { p_pack_code: 'P5', p: expect.objectContaining({ code: 'plus', price: 6000 }) });
  });

  it('saves an extra', async () => {
    await expect(saveExtra(idle, form(extra))).resolves.toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_pricing_set_extra', { p: expect.objectContaining({ code: 'copywriting', billing: 'one_off', description: null }) });
  });

  it.each([
    ['price', { price: '0' }, { price: 'adminPricing.errors.price' }],
    ['weeks', { weeks: '200' }, { weeks: 'adminPricing.errors.weeks' }],
    ['code', { code: 'p6' }, { code: 'adminPricing.errors.code' }],
    ['name_es', { name_es: '' }, { name_es: 'adminPricing.errors.name' }],
  ])('answers a field error for a bad %s and calls nothing', async (_field, change, fieldErrors) => {
    await expect(savePack(idle, form({ ...pack, ...change }))).resolves.toEqual({ status: 'error', fieldErrors });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.lookups).toEqual([]);
  });

  it('never echoes what the database said', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'secret internals: relation x' } });
    const state = await savePack(idle, form(pack));
    expect(state).toEqual({ status: 'error', formError: 'adminPricing.errors.failed' });
    db.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forbidden' } });
    expect(await savePack(idle, form(pack))).toEqual({ status: 'error', formError: 'adminPricing.errors.forbidden' });
    db.rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'pack_deleted' } });
    expect(await savePack(idle, form(pack))).toEqual({ status: 'error', formError: 'adminPricing.errors.deleted' });
  });
});

describe('deletePriceItem and restorePriceItem', () => {
  it('soft-deletes and restores through the RPCs, an option as PACK:option', async () => {
    await expect(deletePriceItem(idle, form({ kind: 'pack_option', code: 'P5:plus' }))).resolves.toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenLastCalledWith('admin_pricing_delete', { p_kind: 'pack_option', p_code: 'P5:plus' });
    await restorePriceItem(idle, form({ kind: 'extra', code: 'geo' }));
    expect(db.rpc).toHaveBeenLastCalledWith('admin_pricing_restore', { p_kind: 'extra', p_code: 'geo' });
  });

  it('refuses a kind that is not an item (settings) before calling the database', async () => {
    const state = await deletePriceItem(idle, form({ kind: 'settings', code: 'hourly' }));
    expect(state).toEqual({ status: 'error', formError: 'adminPricing.errors.invalid' });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('saveSettings', () => {
  it('updates both rates', async () => {
    await expect(saveSettings(idle, form({ hourly: '45', feature: '200' }))).resolves.toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_pricing_set_settings', { p_hourly: 45, p_feature: 200 });
  });

  it('keeps what was typed when a rate is not valid', async () => {
    const state = await saveSettings(idle, form({ hourly: '0', feature: '200' }));
    expect(state).toEqual({ status: 'error', fieldErrors: { hourly: 'adminPricing.errors.rate' }, values: { hourly: '0', feature: '200' } });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
