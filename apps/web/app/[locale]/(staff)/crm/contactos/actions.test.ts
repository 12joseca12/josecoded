// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Op = { table: string; op: string; args: unknown[] };

const db = vi.hoisted(() => ({
  role: 'closer' as 'admin' | 'closer',
  ops: [] as Op[],
  rpc: vi.fn(),
  results: {} as Record<string, unknown>,
  failUpdate: null as null | { code?: string; message: string },
  adminGuard: vi.fn(),
}));

class Chain {
  constructor(private table: string, private op = 'select') {}
  private record(op: string, args: unknown[]) {
    db.ops.push({ table: this.table, op, args });
    return this;
  }
  select = (...a: unknown[]) => this.record('select', a);
  insert = (...a: unknown[]) => new Chain(this.table, 'insert').record('insert', a);
  update = (...a: unknown[]) => new Chain(this.table, 'update').record('update', a);
  eq = (...a: unknown[]) => this.record('eq', a);
  ilike = (...a: unknown[]) => this.record('ilike', a);
  limit = (...a: unknown[]) => this.record('limit', a);
  maybeSingle = async () => ({ data: db.results[`${this.table}.maybeSingle`] ?? null, error: null });
  single = async () => ({ data: db.results[`${this.table}.single`] ?? { id: 'new-id' }, error: null });
  then = (resolve: (value: unknown) => unknown) =>
    resolve(
      this.op === 'update' && db.failUpdate
        ? { data: null, error: db.failUpdate }
        : { data: this.op === 'update' ? (db.results[`${this.table}.updated`] ?? [{ id: 'c1' }]) : null, error: null },
    );
}

const supabase = { from: (table: string) => new Chain(table), rpc: (...a: unknown[]) => db.rpc(...a) };

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/auth/staff', () => ({
  requireStaff: async () => ({ role: db.role, user: { id: 'me' }, supabase }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: async () => {
    db.adminGuard();
    if (db.role !== 'admin') throw new Error('NOT_FOUND');
    return { user: { id: 'me' }, supabase };
  },
}));
vi.mock('@/lib/crm/contact-detail', () => ({ getAffiliateLevel: async () => 'standard' }));

import {
  addContactNote,
  changeContactStatus,
  closeLeadPaid,
  createContact,
  inviteClientAccess,
  reassignContact,
  requestClose,
  setContactNextAction,
} from './actions';

const idle = { status: 'idle' } as const;
const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set('locale', 'es');
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const updates = () => db.ops.filter((op) => op.op === 'update');
const inserts = (table: string) => db.ops.filter((op) => op.op === 'insert' && op.table === table);

beforeEach(() => {
  db.role = 'closer';
  db.ops.length = 0;
  db.results = { 'crm_contacts.maybeSingle': { id, kind: 'lead', status: 'contacted' } };
  db.failUpdate = null;
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: null, error: null });
  db.adminGuard.mockReset();
});

describe('changeContactStatus', () => {
  it('asks for the next action when the new status is not final', async () => {
    const state = await changeContactStatus(idle, form({ contact_id: id, status: 'proposal_sent' }));
    expect(state).toMatchObject({ status: 'error', fieldErrors: { next_action: 'crmContacts.errors.nextActionRequired' } });
    expect(updates()).toHaveLength(0);
  });

  it('saves status and next action together, on the Madrid clock', async () => {
    const state = await changeContactStatus(
      idle,
      form({ contact_id: id, status: 'proposal_sent', next_action: 'Llamar', next_action_date: '2026-11-04', next_action_time: '10:00' }),
    );
    expect(state).toEqual({ status: 'ok' });
    expect(updates()[0]?.args[0]).toEqual({ status: 'proposal_sent', next_action: 'Llamar', next_action_at: '2026-11-04T09:00:00.000Z' });
  });

  it('clears the next action when the status is final', async () => {
    await changeContactStatus(idle, form({ contact_id: id, status: 'lost' }));
    expect(updates()[0]?.args[0]).toEqual({ status: 'lost', next_action: null, next_action_at: null });
  });

  it('never lets a closer set «won» or «active_client»', async () => {
    for (const status of ['won', 'active_client']) {
      const state = await changeContactStatus(idle, form({ contact_id: id, status }));
      expect(state).toMatchObject({ status: 'error', fieldErrors: { status: 'crmContacts.errors.statusNotAllowed' } });
    }
    expect(updates()).toHaveLength(0);
  });

  it('lets the admin set «won»', async () => {
    db.role = 'admin';
    expect(await changeContactStatus(idle, form({ contact_id: id, status: 'won' }))).toEqual({ status: 'ok' });
  });

  it('refuses a status of another kind', async () => {
    const state = await changeContactStatus(idle, form({ contact_id: id, status: 'meeting', next_action: 'x', next_action_date: '2026-11-04' }));
    expect(state).toMatchObject({ status: 'error' });
    expect(updates()).toHaveLength(0);
  });

  it('answers «not found» when RLS gives no row (a contact that is not hers)', async () => {
    db.results['crm_contacts.maybeSingle'] = null;
    const state = await changeContactStatus(idle, form({ contact_id: id, status: 'lost' }));
    expect(state).toMatchObject({ status: 'error', formError: 'crmContacts.errors.notFound' });
  });

  it('turns the database trigger error into the field message', async () => {
    db.failUpdate = { code: '23514', message: 'next_action_required: status new needs next_action_at' };
    const state = await changeContactStatus(idle, form({ contact_id: id, status: 'lost' }));
    expect(state).toMatchObject({ status: 'error', formError: 'crmContacts.errors.nextActionRequired' });
  });
});

describe('setContactNextAction', () => {
  it('needs text and day', async () => {
    expect(await setContactNextAction(idle, form({ contact_id: id, next_action: 'Llamar' }))).toMatchObject({ status: 'error' });
    expect(updates()).toHaveLength(0);
  });
  it('saves them', async () => {
    const state = await setContactNextAction(idle, form({ contact_id: id, next_action: 'Llamar', next_action_date: '2026-07-15' }));
    expect(state).toEqual({ status: 'ok' });
    expect(updates()[0]?.args[0]).toEqual({ next_action: 'Llamar', next_action_at: '2026-07-15T07:00:00.000Z' });
  });
});

describe('addContactNote', () => {
  it('signs the note by the role of the session, not by the form', async () => {
    await addContactNote(idle, form({ contact_id: id, body: 'Hola', actor: 'jose' }));
    expect(inserts('crm_interactions')[0]?.args[0]).toMatchObject({ kind: 'note', actor: 'closer', body: 'Hola' });
    db.ops.length = 0;
    db.role = 'admin';
    await addContactNote(idle, form({ contact_id: id, body: 'Hola' }));
    expect(inserts('crm_interactions')[0]?.args[0]).toMatchObject({ actor: 'jose' });
  });
  it('refuses an empty note', async () => {
    expect(await addContactNote(idle, form({ contact_id: id, body: '  ' }))).toMatchObject({ status: 'error' });
  });
});

describe('createContact', () => {
  const base = { kind: 'agency', display_name: 'Elena', status: 'pending', next_action: 'Invitar', next_action_date: '2026-11-05' };

  it('gives a closer’s contact to the closer whatever the form says', async () => {
    await expect(createContact(idle, form({ ...base, owner_id: other }))).rejects.toThrow('REDIRECT /crm/contactos/new-id');
    expect(inserts('crm_contacts')[0]?.args[0]).toMatchObject({ owner_id: 'me', source: 'manual' });
  });

  it('lets the admin choose the owner, or none', async () => {
    db.role = 'admin';
    await expect(createContact(idle, form({ ...base, owner_id: other }))).rejects.toThrow('REDIRECT');
    expect(inserts('crm_contacts')[0]?.args[0]).toMatchObject({ owner_id: other });
    db.ops.length = 0;
    await expect(createContact(idle, form({ ...base, owner_id: '' }))).rejects.toThrow('REDIRECT');
    expect(inserts('crm_contacts')[0]?.args[0]).toMatchObject({ owner_id: null });
  });

  it('opens the lead of a manual lead contact', async () => {
    await expect(createContact(idle, form({ ...base, kind: 'lead', status: 'new' }))).rejects.toThrow('REDIRECT');
    expect(inserts('leads')[0]?.args[0]).toEqual({ contact_id: 'new-id', source: 'manual' });
  });

  it('refuses a status a closer cannot set, and a missing name', async () => {
    expect(await createContact(idle, form({ ...base, kind: 'lead', status: 'won' }))).toMatchObject({ status: 'error' });
    expect(await createContact(idle, form({ ...base, display_name: ' ' }))).toMatchObject({ status: 'error' });
    expect(inserts('crm_contacts')).toHaveLength(0);
  });

  it('creates the organisation when it does not exist', async () => {
    await expect(createContact(idle, form({ ...base, organization: 'Norte Digital' }))).rejects.toThrow('REDIRECT');
    expect(inserts('crm_organizations')[0]?.args[0]).toMatchObject({ name: 'Norte Digital', kind: 'agency' });
  });
});

describe('reassignContact', () => {
  it('is the admin’s: the guard runs before anything is read, and a closer never reaches the write', async () => {
    await expect(reassignContact(idle, form({ contact_id: id, owner_id: other }))).rejects.toThrow('NOT_FOUND');
    expect(db.adminGuard).toHaveBeenCalled();
    expect(updates()).toHaveLength(0);
  });

  it('moves the contact to an active staff member and leaves a note', async () => {
    db.role = 'admin';
    db.results['staff_members.maybeSingle'] = { user_id: other, display_name: 'Carla', disabled_at: null };
    expect(await reassignContact(idle, form({ contact_id: id, owner_id: other }))).toEqual({ status: 'ok' });
    expect(updates()[0]?.args[0]).toEqual({ owner_id: other });
    expect(inserts('crm_interactions')[0]?.args[0]).toMatchObject({ kind: 'note', actor: 'jose' });
  });

  it('refuses a deactivated closer as the new owner', async () => {
    db.role = 'admin';
    db.results['staff_members.maybeSingle'] = { user_id: other, display_name: 'Dani', disabled_at: '2026-10-01' };
    expect(await reassignContact(idle, form({ contact_id: id, owner_id: other }))).toMatchObject({ status: 'error' });
    expect(updates()).toHaveLength(0);
  });

  it('can leave the contact unassigned', async () => {
    db.role = 'admin';
    await reassignContact(idle, form({ contact_id: id, owner_id: '' }));
    expect(updates()[0]?.args[0]).toEqual({ owner_id: null });
  });
});

describe('inviteClientAccess', () => {
  it('sends a closer’s invitation with the email of the contact only', async () => {
    await inviteClientAccess(idle, form({ client_id: id, contact_id: id, email: 'mine@evil.test' }));
    expect(db.rpc).toHaveBeenCalledWith('invite_client_access', { p_client_id: id, p_email: '' });
  });
  it('lets the admin write another address', async () => {
    db.role = 'admin';
    await inviteClientAccess(idle, form({ client_id: id, contact_id: id, email: 'new@client.test' }));
    expect(db.rpc).toHaveBeenCalledWith('invite_client_access', { p_client_id: id, p_email: 'new@client.test' });
  });
  it('explains a rule of the database', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: 'email_is_staff' } });
    expect(await inviteClientAccess(idle, form({ client_id: id, contact_id: id, email: '' }))).toMatchObject({
      status: 'error',
      formError: 'crmContacts.errors.accessEmailStaff',
    });
  });
});

describe('requestClose', () => {
  it('calls the RPC with the lead', async () => {
    expect(await requestClose(idle, form({ lead_id: id, contact_id: id }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('crm_request_close', { p_lead_id: id });
  });
  it('turns the refusal of the database into a message', async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forbidden' } });
    expect(await requestClose(idle, form({ lead_id: id, contact_id: id }))).toMatchObject({ formError: 'crmContacts.errors.forbidden' });
  });
});

describe('closeLeadPaid', () => {
  beforeEach(() => {
    db.results['leads.maybeSingle'] = { id, status: 'open', pack_code: 'P1', affiliate_code: 'ANA-3B7K2Q', contact_id: id };
  });

  it('is never callable by a closer: the admin guard fails before the lead is read and the RPC is not called', async () => {
    await expect(closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '1400' }))).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.ops).toHaveLength(0);
  });

  it('closes with the reward of the affiliate and the commission left to the RPC', async () => {
    db.role = 'admin';
    expect(await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '1.400', commission: 'auto' }))).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_close_lead_paid', {
      p_lead_id: id,
      p_amount: 1400,
      p_generate_reward: true,
      p_reward_type: 'percent',
      p_reward_amount: 140,
      p_reward_percent: 10,
    });
  });

  it('sends Jose’s commission decision', async () => {
    db.role = 'admin';
    await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '900', commission: 'yes' }));
    expect(db.rpc.mock.calls[0]?.[1]).toMatchObject({ p_commission: true });
  });

  it('refuses a lead that is not of that contact, a closed one and a bad amount', async () => {
    db.role = 'admin';
    db.results['leads.maybeSingle'] = { id, status: 'open', pack_code: 'P1', affiliate_code: null, contact_id: other };
    expect(await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '900' }))).toMatchObject({ status: 'error' });
    db.results['leads.maybeSingle'] = { id, status: 'won', pack_code: 'P1', affiliate_code: null, contact_id: id };
    expect(await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '900' }))).toMatchObject({
      formError: 'crmContacts.errors.leadClosed',
    });
    expect(await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: 'mucho' }))).toMatchObject({
      fieldErrors: { amount: 'crmContacts.errors.amountInvalid' },
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('sets the pack of a manual lead before closing it', async () => {
    db.role = 'admin';
    db.results['leads.maybeSingle'] = { id, status: 'open', pack_code: null, affiliate_code: null, contact_id: id };
    await closeLeadPaid(idle, form({ lead_id: id, contact_id: id, amount: '900', pack_code: 'P2' }));
    expect(updates()[0]?.args[0]).toEqual({ pack_code: 'P2' });
    expect(db.rpc).toHaveBeenCalled();
  });
});
