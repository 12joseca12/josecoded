// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { id: 'me' } as null | { id: string },
  insert: vi.fn(),
  error: null as null | { code: string },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: () => ({
      insert: async (row: unknown) => {
        db.insert(row);
        return { error: db.error };
      },
    }),
  }),
}));

import { ensureAffiliate } from './actions';

const idle = { status: 'idle' } as const;
const form = (fields: Record<string, string> = { locale: 'es' }) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  db.user = { id: 'me' };
  db.error = null;
});

describe('ensureAffiliate', () => {
  it('inserts only the user id: code and level are never taken from the request', async () => {
    const state = await ensureAffiliate(idle, form({ locale: 'es', code: 'EVIL-000000', level: 'premium', user_id: 'someone-else' }));
    expect(state).toEqual({ status: 'ok' });
    expect(db.insert).toHaveBeenCalledWith({ user_id: 'me' });
  });

  it('treats an existing code (unique user_id) as success', async () => {
    db.error = { code: '23505' };
    expect(await ensureAffiliate(idle, form())).toEqual({ status: 'ok' });
  });

  it('reports other errors and refuses anonymous calls', async () => {
    db.error = { code: '42501' };
    expect(await ensureAffiliate(idle, form())).toMatchObject({ status: 'error', formError: 'area.referrals.failed' });
    db.user = null;
    db.insert.mockClear();
    expect(await ensureAffiliate(idle, form())).toMatchObject({ status: 'error' });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
