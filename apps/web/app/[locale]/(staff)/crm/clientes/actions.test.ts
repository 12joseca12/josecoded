// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  role: 'closer' as 'admin' | 'closer',
  status: 'proposed' as string | null,
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
vi.mock('@/lib/auth/staff', () => ({
  requireStaff: async () => {
    db.guard();
    if (!db.role) throw new Error('NOT_FOUND');
    return { user: { id: 'me' }, role: db.role, supabase };
  },
}));

import { convertStory, decideStory } from './actions';

const idle = { status: 'idle' } as const;
const id = '11111111-1111-4111-8111-111111111111';
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set('locale', 'es');
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const accept = (extra: Record<string, string> = {}) => form({ story_id: id, decision: 'accept', hours: '6', create_task: 'on', ...extra });

beforeEach(() => {
  db.role = 'closer';
  db.status = 'proposed';
  db.guard.mockReset();
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: null, error: null });
});

describe('every action', () => {
  it('asks who the person is before reading the form: no staff, 404, nothing is called', async () => {
    db.role = '' as 'admin';
    await expect(decideStory(idle, accept())).rejects.toThrow('NOT_FOUND');
    await expect(convertStory(idle, form({ story_id: id }))).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('decideStory · accept', () => {
  it('accepts with hours, an optional amount and note, and creates the task when the box is on', async () => {
    const answer = await decideStory(idle, accept({ hours: '6,5', amount: '240,50', note: ' Va con el módulo de pedidos. ' }));
    expect(answer).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('accept_user_story', {
      p_story_id: id,
      p_estimate_hours: 6.5,
      p_estimate_amount: 240.5,
      p_note: 'Va con el módulo de pedidos.',
      p_create_task: true,
    });
  });

  it('without amount and note sends nulls, and without the box it does not create the task', async () => {
    const data = form({ story_id: id, decision: 'accept', hours: '3' });
    expect(await decideStory(idle, data)).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('accept_user_story', {
      p_story_id: id,
      p_estimate_hours: 3,
      p_estimate_amount: null,
      p_note: null,
      p_create_task: false,
    });
  });

  it('the admin decides too', async () => {
    db.role = 'admin';
    expect(await decideStory(idle, accept())).toEqual({ status: 'ok' });
  });

  it('refuses hours that are missing, zero, negative or with two decimals, without calling the database', async () => {
    for (const hours of ['', '0', '-2', '1.25', 'seis']) {
      expect(await decideStory(idle, accept({ hours }))).toMatchObject({
        status: 'error',
        fieldErrors: { hours: 'crmClients.errors.hoursInvalid' },
        values: { hours },
      });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses an amount that is negative or has three decimals', async () => {
    for (const amount of ['-5', '10.123', 'mucho']) {
      expect(await decideStory(idle, accept({ amount }))).toMatchObject({ fieldErrors: { amount: 'crmClients.errors.amountInvalid' } });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses a note over 1.000 characters', async () => {
    expect(await decideStory(idle, accept({ note: 'x'.repeat(1001) }))).toMatchObject({ fieldErrors: { note: 'crmClients.errors.noteTooLong' } });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('decideStory · reject', () => {
  it('rejects with the reason the client will read', async () => {
    const answer = await decideStory(idle, form({ story_id: id, decision: 'reject', reason: '  Queda fuera del pack.  ' }));
    expect(answer).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('reject_user_story', { p_story_id: id, p_note: 'Queda fuera del pack.' });
  });

  it('refuses a blank reason', async () => {
    expect(await decideStory(idle, form({ story_id: id, decision: 'reject', reason: '   ' }))).toMatchObject({
      status: 'error',
      fieldErrors: { reason: 'crmClients.errors.reasonRequired' },
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('decideStory · what is not allowed', () => {
  it('refuses a decision that is not accept or reject, and an id that is not a uuid', async () => {
    expect(await decideStory(idle, form({ story_id: id, decision: 'convert' }))).toMatchObject({ formError: 'crmClients.errors.invalid' });
    expect(await decideStory(idle, accept({ story_id: 'nope' }))).toMatchObject({ formError: 'crmClients.errors.invalid' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('answers invalidTransition for a story that is not proposed (a stale screen), without calling the database', async () => {
    for (const status of ['accepted', 'converted', 'rejected']) {
      db.status = status;
      expect(await decideStory(idle, accept())).toMatchObject({ formError: 'crmClients.errors.invalidTransition' });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('answers notFound for a story this person cannot read (another closer\'s client) or that does not exist', async () => {
    db.status = null;
    expect(await decideStory(idle, accept())).toMatchObject({ formError: 'crmClients.errors.notFound' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('turns what the database says into the screen\'s words', async () => {
    const cases: [{ code?: string; message: string }, string][] = [
      [{ code: '22023', message: 'story_not_proposed' }, 'invalidTransition'],
      [{ code: '42501', message: 'forbidden' }, 'forbidden'],
      [{ code: '22023', message: 'estimate_required' }, 'hoursInvalid'],
      [{ code: 'P0002', message: 'story_not_found' }, 'notFound'],
      [{ code: 'XX000', message: 'boom' }, 'failed'],
    ];
    for (const [error, key] of cases) {
      db.rpc.mockResolvedValueOnce({ data: null, error });
      expect(await decideStory(idle, accept())).toMatchObject({ status: 'error', formError: `crmClients.errors.${key}` });
    }
  });
});

describe('convertStory', () => {
  it('converts an accepted story', async () => {
    db.status = 'accepted';
    expect(await convertStory(idle, form({ story_id: id }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('convert_user_story', { p_story_id: id });
  });

  it('refuses one that is still proposed, already a task or rejected, without calling the database', async () => {
    for (const status of ['proposed', 'converted', 'rejected']) {
      db.status = status;
      expect(await convertStory(idle, form({ story_id: id }))).toMatchObject({ formError: 'crmClients.errors.invalidTransition' });
    }
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses an id that is not a uuid and a story that is not there', async () => {
    expect(await convertStory(idle, form({ story_id: 'x' }))).toMatchObject({ formError: 'crmClients.errors.invalid' });
    db.status = null;
    expect(await convertStory(idle, form({ story_id: id }))).toMatchObject({ formError: 'crmClients.errors.notFound' });
  });
});
