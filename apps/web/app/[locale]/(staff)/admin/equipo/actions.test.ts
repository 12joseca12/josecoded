// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  role: 'admin' as 'admin' | 'closer',
  invite: { email: 'clara@correo.test', role: 'closer', commission_rate: 12 } as Record<string, unknown> | null,
  removed: [{ id: 'x' }] as unknown[],
  rpc: vi.fn(),
  guard: vi.fn(),
}));

const invites = {
  select: () => ({ eq: () => ({ is: () => ({ maybeSingle: async () => ({ data: db.invite, error: null }) }) }) }),
  delete: () => ({ eq: () => ({ is: () => ({ select: async () => ({ data: db.removed, error: null }) }) }) }),
};
const supabase = { from: () => invites, rpc: (...args: unknown[]) => db.rpc(...args) };

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: async () => {
    db.guard();
    if (db.role !== 'admin') throw new Error('NOT_FOUND');
    return { user: { id: ME }, supabase };
  },
}));

import { cancelInvite, inviteStaff, reassignContacts, resendInvite, setRate, setStaff } from './actions';

const ME = '99999999-9999-4999-8999-999999999999';
const CARLA = '11111111-1111-4111-8111-111111111111';
const DANI = '22222222-2222-4222-8222-222222222222';
const idle = { status: 'idle' } as const;
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set('locale', 'es');
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  db.role = 'admin';
  db.invite = { email: 'clara@correo.test', role: 'closer', commission_rate: 12 };
  db.removed = [{ id: 'x' }];
  db.guard.mockReset();
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: null, error: null });
});

describe('every action', () => {
  it('asks for the admin before anything else: a closer gets the 404 and nothing is called', async () => {
    db.role = 'closer';
    const calls = [
      inviteStaff(idle, form({ email: 'a@b.test', role: 'closer', rate: '10' })),
      resendInvite(idle, form({ id: CARLA })),
      cancelInvite(idle, form({ id: CARLA })),
      setStaff(idle, form({ id: CARLA, disabled: 'true' })),
      setRate(idle, form({ user_id: CARLA, rate: '10' })),
      reassignContacts(idle, form({ from: CARLA, to: DANI })),
    ];
    for (const call of calls) await expect(call).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('inviteStaff', () => {
  it('invites with the normalized email and the rate as a number', async () => {
    expect(await inviteStaff(idle, form({ email: ' Clara@Correo.TEST ', role: 'closer', rate: '12,5' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_staff_invite', { p_email: 'clara@correo.test', p_role: 'closer', p_commission_rate: 12.5 });
  });

  it('refuses a missing or out-of-range rate on the rate field, and gives back what was typed', async () => {
    for (const rate of ['', '101', 'diez']) {
      const state = await inviteStaff(idle, form({ email: 'a@b.test', role: 'closer', rate }));
      expect(state).toMatchObject({ status: 'error', fieldErrors: { rate: 'adminTeam.errors.rate' }, values: { email: 'a@b.test', rate } });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses a bad email and an admin role', async () => {
    expect(await inviteStaff(idle, form({ email: 'nope', role: 'closer', rate: '10' }))).toMatchObject({ fieldErrors: { email: 'adminTeam.errors.email' } });
    expect(await inviteStaff(idle, form({ email: 'a@b.test', role: 'admin', rate: '10' }))).toMatchObject({ formError: 'adminTeam.errors.invalid' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('turns the database answers into screen messages and never echoes the raw text', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'already_staff' } });
    expect(await inviteStaff(idle, form({ email: 'a@b.test', role: 'closer', rate: '10' }))).toMatchObject({ formError: 'adminTeam.errors.alreadyStaff' });
    db.rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'relation "auth.users" boom' } });
    expect(await inviteStaff(idle, form({ email: 'a@b.test', role: 'closer', rate: '10' }))).toMatchObject({ formError: 'adminTeam.errors.failed' });
  });
});

describe('resendInvite / cancelInvite', () => {
  it('resends with the data of the invitation itself, not what the form says', async () => {
    expect(await resendInvite(idle, form({ id: CARLA, rate: '99' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_staff_invite', { p_email: 'clara@correo.test', p_role: 'closer', p_commission_rate: 12 });
  });

  it('answers notFound for an invitation that is gone or already claimed', async () => {
    db.invite = null;
    expect(await resendInvite(idle, form({ id: CARLA }))).toMatchObject({ formError: 'adminTeam.errors.notFound' });
    db.removed = [];
    expect(await cancelInvite(idle, form({ id: CARLA }))).toMatchObject({ formError: 'adminTeam.errors.notFound' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('cancels an open invitation and refuses an id that is not a uuid', async () => {
    expect(await cancelInvite(idle, form({ id: CARLA }))).toEqual({ status: 'ok' });
    expect(await cancelInvite(idle, form({ id: 'x' }))).toMatchObject({ formError: 'adminTeam.errors.invalid' });
  });
});

describe('setStaff', () => {
  it('deactivates and reactivates, keeping rate and notes (null)', async () => {
    expect(await setStaff(idle, form({ id: CARLA, disabled: 'true' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_staff_set', { p_user_id: CARLA, p_disabled: true, p_commission_rate: null, p_notes: null });
    await setStaff(idle, form({ id: CARLA, disabled: 'false' }));
    expect(db.rpc).toHaveBeenLastCalledWith('admin_staff_set', expect.objectContaining({ p_disabled: false }));
  });

  it('never touches the admin himself', async () => {
    expect(await setStaff(idle, form({ id: ME, disabled: 'true' }))).toMatchObject({ formError: 'adminTeam.errors.self' });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('setRate', () => {
  it('sets the rate and keeps the rest', async () => {
    expect(await setRate(idle, form({ user_id: CARLA, rate: '15' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_staff_set', { p_user_id: CARLA, p_disabled: null, p_commission_rate: 15, p_notes: null });
  });

  it('refuses out-of-range rates and the admin row', async () => {
    expect(await setRate(idle, form({ user_id: CARLA, rate: '100,5' }))).toMatchObject({ fieldErrors: { rate: 'adminTeam.errors.rate' } });
    expect(await setRate(idle, form({ user_id: ME, rate: '10' }))).toMatchObject({ formError: 'adminTeam.errors.self' });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('reassignContacts', () => {
  it('moves the portfolio', async () => {
    expect(await reassignContacts(idle, form({ from: CARLA, to: DANI }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_reassign_contacts', { p_from: CARLA, p_to: DANI });
  });

  it('refuses to move the admin row, a move onto itself and malformed ids', async () => {
    expect(await reassignContacts(idle, form({ from: ME, to: DANI }))).toMatchObject({ formError: 'adminTeam.errors.self' });
    expect(await reassignContacts(idle, form({ from: CARLA, to: CARLA }))).toMatchObject({ formError: 'adminTeam.errors.sameTarget' });
    expect(await reassignContacts(idle, form({ from: CARLA, to: '' }))).toMatchObject({ formError: 'adminTeam.errors.invalid' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('maps a missing target to notFound', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'staff_not_found' } });
    expect(await reassignContacts(idle, form({ from: CARLA, to: DANI }))).toMatchObject({ formError: 'adminTeam.errors.notFound' });
  });
});
