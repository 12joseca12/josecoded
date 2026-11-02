// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  role: 'admin' as 'admin' | 'closer',
  status: 'pending' as string | null,
  rpc: vi.fn(),
  guard: vi.fn(),
}));

const supabase = {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.status ? { status: db.status } : null, error: null }) }) }),
  }),
  rpc: (...args: unknown[]) => db.rpc(...args),
};

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: async () => {
    db.guard();
    if (db.role !== 'admin') throw new Error('NOT_FOUND');
    return { user: { id: 'me' }, supabase };
  },
}));

import { approveCommission, markCommissionPaid, rejectCommission } from './actions';

const idle = { status: 'idle' } as const;
const id = '11111111-1111-4111-8111-111111111111';
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set('locale', 'es');
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  db.role = 'admin';
  db.status = 'pending';
  db.guard.mockReset();
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: null, error: null });
});

describe('every action', () => {
  it('asks for the admin before reading anything (a closer gets the 404 and nothing is called)', async () => {
    db.role = 'closer';
    await expect(approveCommission(idle, form({ commission_id: id }))).rejects.toThrow('NOT_FOUND');
    await expect(rejectCommission(idle, form({ commission_id: id, reason: 'x' }))).rejects.toThrow('NOT_FOUND');
    await expect(markCommissionPaid(idle, form({ commission_id: id, paid_at: '2026-11-01' }))).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('approveCommission', () => {
  it('approves a pending commission', async () => {
    expect(await approveCommission(idle, form({ commission_id: id }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_commission_approve', { p_id: id });
  });

  it('refuses an id that is not a uuid', async () => {
    expect(await approveCommission(idle, form({ commission_id: 'nope' }))).toMatchObject({ status: 'error', formError: 'crmCommissions.errors.invalid' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('answers invalidTransition for one that is not pending, without calling the database', async () => {
    for (const status of ['approved', 'paid', 'rejected']) {
      db.status = status;
      expect(await approveCommission(idle, form({ commission_id: id }))).toMatchObject({ status: 'error', formError: 'crmCommissions.errors.invalidTransition' });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('answers notFound for a commission that does not exist', async () => {
    db.status = null;
    expect(await approveCommission(idle, form({ commission_id: id }))).toMatchObject({ formError: 'crmCommissions.errors.notFound' });
  });

  it('turns what the database says into a message of the screen', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'commission_not_pending' } });
    expect(await approveCommission(idle, form({ commission_id: id }))).toMatchObject({ formError: 'crmCommissions.errors.invalidTransition' });
    db.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forbidden' } });
    expect(await approveCommission(idle, form({ commission_id: id }))).toMatchObject({ formError: 'crmCommissions.errors.forbidden' });
    db.rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });
    expect(await approveCommission(idle, form({ commission_id: id }))).toMatchObject({ formError: 'crmCommissions.errors.failed' });
  });
});

describe('rejectCommission', () => {
  it('needs a reason, and gives back what was typed', async () => {
    const state = await rejectCommission(idle, form({ commission_id: id, reason: '   ' }));
    expect(state).toMatchObject({ status: 'error', fieldErrors: { reason: 'crmCommissions.errors.reasonRequired' } });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('rejects a pending commission with the trimmed reason', async () => {
    expect(await rejectCommission(idle, form({ commission_id: id, reason: '  Cobro devuelto  ' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_commission_reject', { p_id: id, p_reason: 'Cobro devuelto' });
  });

  it('does not reject an approved one', async () => {
    db.status = 'approved';
    expect(await rejectCommission(idle, form({ commission_id: id, reason: 'x' }))).toMatchObject({ formError: 'crmCommissions.errors.invalidTransition' });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('markCommissionPaid', () => {
  it('pays an approved commission on the given day (noon in Madrid) with the note', async () => {
    db.status = 'approved';
    expect(await markCommissionPaid(idle, form({ commission_id: id, paid_at: '2026-10-15', note: ' transferencia ' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_commission_mark_paid', { p_id: id, p_paid_at: '2026-10-15T10:00:00.000Z', p_note: 'transferencia' });
  });

  it('refuses to pay a pending commission: invalid_transition and no call', async () => {
    db.status = 'pending';
    const state = await markCommissionPaid(idle, form({ commission_id: id, paid_at: '2026-10-15' }));
    expect(state).toMatchObject({ status: 'error', formError: 'crmCommissions.errors.invalidTransition' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses a day in the future and a malformed date', async () => {
    db.status = 'approved';
    expect(await markCommissionPaid(idle, form({ commission_id: id, paid_at: '2999-01-01' }))).toMatchObject({
      fieldErrors: { paid_at: 'crmCommissions.errors.futureDate' },
    });
    expect(await markCommissionPaid(idle, form({ commission_id: id, paid_at: 'ayer' }))).toMatchObject({
      fieldErrors: { paid_at: 'crmCommissions.errors.invalid' },
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
