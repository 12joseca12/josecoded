// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  context: null as unknown,
  rpc: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', async (importActual) => ({
  ...(await importActual<typeof import('next/navigation')>()),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/area/queries', () => ({ getAreaContext: async () => mocks.context }));

import { requestUpgrade } from './actions';

const idle = { status: 'idle' } as const;
function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const value of Array.isArray(v) ? v : [v]) data.append(k, value);
  return data;
}
const ana = (pack = 'P2') => ({ client: { id: 'c1', pack_code: pack }, isAdmin: false, session: { supabase: { rpc: mocks.rpc } } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.context = ana();
  mocks.rpc.mockResolvedValue({ data: 'request-id', error: null });
});

describe('requestUpgrade', () => {
  it('calls the RPC with only the choice (no price) and lands on the plan page', async () => {
    await expect(requestUpgrade(idle, form({ toPack: 'P3', extras: ['geo'], locale: 'es', computed_price: '1' }))).rejects.toThrow(
      'REDIRECT /area-clientes/pack?requested=1',
    );
    expect(mocks.rpc).toHaveBeenCalledWith('request_upgrade', { p_to_pack_code: 'P3', p_extras: ['geo'] });
  });

  it('uses the English route in English', async () => {
    await expect(requestUpgrade(idle, form({ toPack: 'P3', locale: 'en' }))).rejects.toThrow('REDIRECT /en/client-area/plan?requested=1');
  });

  it('allows extras alone (no pack)', async () => {
    await expect(requestUpgrade(idle, form({ toPack: '', extras: ['seo_full'], locale: 'es' }))).rejects.toThrow('REDIRECT');
    expect(mocks.rpc).toHaveBeenCalledWith('request_upgrade', { p_to_pack_code: null, p_extras: ['seo_full'] });
  });

  it.each([
    ['nothing selected', { toPack: '', locale: 'es' }, 'nothing'],
    ['an unknown pack', { toPack: 'P9', locale: 'es' }, 'nothing'],
    ['an unknown extra', { toPack: '', extras: ['free_everything'], locale: 'es' }, 'nothing'],
    ['the same pack', { toPack: 'P2', locale: 'es' }, 'notAnUpgrade'],
    ['a lower pack', { toPack: 'P1', locale: 'es' }, 'notAnUpgrade'],
  ])('refuses %s before reaching the database', async (_label, fields, key) => {
    const state = await requestUpgrade(idle, form(fields as Record<string, string | string[]>));
    expect(state).toEqual({ status: 'error', formError: `area.plan.upgrade.errors.${key}` });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('maps the one-pending rule (23505) to its own message', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'upgrade_already_pending' } });
    expect(await requestUpgrade(idle, form({ toPack: 'P3', locale: 'es' }))).toEqual({
      status: 'error',
      formError: 'area.plan.upgrade.errors.alreadyPending',
    });
  });

  it('refuses non-clients and staff', async () => {
    mocks.context = { ...ana(), client: null };
    expect(await requestUpgrade(idle, form({ toPack: 'P3', locale: 'es' }))).toMatchObject({ status: 'error' });
    mocks.context = { ...ana(), isAdmin: true };
    expect(await requestUpgrade(idle, form({ toPack: 'P3', locale: 'es' }))).toMatchObject({ status: 'error' });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
