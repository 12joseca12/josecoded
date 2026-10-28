// @vitest-environment node
// RLS with four accounts against Supabase local: one assertion per cell of DATOS v1.2 §5 (plan v3.2, tasks 1.6, 1.8a
// and 1.8b) plus the RPC behaviours of the 1.8a and 1.8b test extracts. Needs `supabase start` + `supabase db reset` (migrations +
// seed). Skipped with a warning when the stack does not answer locally, and a failure in CI (same criterion as
// packages/types/test/database-drift.test.ts). The SQL twin that runs without Supabase is supabase/test/pg/.
// The tests write through PostgREST (no rollback), so whatever they create uses fresh ids and keys: they can run
// again on the same database without a reset.
import { randomUUID } from 'node:crypto';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  LOCAL_URL,
  SEED,
  TEST_PASSWORD,
  clientFor,
  serviceClient,
  supabaseIsUp,
  type TestClient,
} from './helpers/supabase-test-clients';

type Row = Record<string, unknown>;

const up = await supabaseIsUp();
const inCi = Boolean(process.env.CI);
if (!up) {
  console.warn(
    `[rls] Supabase local not reachable at ${LOCAL_URL}: RLS tests skipped.` +
      (inCi ? ' In CI this is an error.' : ' Run `supabase start && supabase db reset` to enable them.'),
  );
}

const CRM_TABLES = [
  'crm_organizations',
  'crm_contacts',
  'crm_interactions',
  'crm_message_templates',
  'crm_message_drafts',
] as const;
const AREA_TABLES = ['clients', 'client_tasks', 'client_task_comments', 'client_assets', 'client_extras', 'upgrade_requests'] as const;
const CHAT_TABLES = ['chat_contexts', 'chat_threads', 'chat_messages'] as const;
const PRIVATE_TO_ANON = [...CRM_TABLES, 'leads', ...AREA_TABLES, 'affiliates', 'affiliate_rewards', ...CHAT_TABLES, 'staff_members', 'user_profiles', 'packs'] as const;

/** Primary key column of the tables without an `id`. */
const KEY: Record<string, string> = { staff_members: 'user_id', user_profiles: 'user_id', packs: 'code', extras: 'code' };

/**
 * Rows a client reads from a table. Only a permission error (42501: no grant) counts as 0 rows; any other error (a
 * wrong column, a missing table) throws, so a typo can never pass as «denied».
 */
async function visible(c: TestClient, table: string, columns = KEY[table] ?? 'id'): Promise<number> {
  const { data, error } = await c.from(table).select(columns);
  if (error) {
    if (error.code === '42501') return 0;
    throw new Error(`${table}: ${error.code} ${error.message}`);
  }
  return (data ?? []).length;
}

describe.skipIf(!up && !inCi)('RLS with jose (admin), ana (P2 client + affiliate), bob (affiliate), sin (unconfirmed)', () => {
  let jose: TestClient;
  let ana: TestClient;
  let bob: TestClient;
  let sin: TestClient;
  let anon: TestClient;
  const service = serviceClient();

  beforeAll(async () => {
    expect(up, `Supabase local must be running in CI (${LOCAL_URL})`).toBe(true);
    // Sequential: sin@test is confirmed for a moment while it logs in, and the others do not depend on it.
    jose = await clientFor('jose');
    ana = await clientFor('ana');
    bob = await clientFor('bob');
    sin = await clientFor('sin');
    anon = await clientFor('anon');
  }, 30_000);

  /** A fresh lead contact owned by the test, so status changes can run again on the same database. */
  async function freshContact(kind = 'lead', status = 'new'): Promise<string> {
    const { data, error } = await jose
      .from('crm_contacts')
      .insert({ kind, status, display_name: `Test ${randomUUID()}`, source: 'manual' })
      .select('id')
      .single();
    expect(error).toBeNull();
    return (data as Row).id as string;
  }

  describe('anon', () => {
    it.each(PRIVATE_TO_ANON)('reads 0 rows (or is denied) on %s', async (table) => {
      expect(await visible(anon, table)).toBe(0);
    });

    it('cannot call any 1.8a or 1.8b RPC', async () => {
      const calls = await Promise.all([
        anon.rpc('create_lead', { p: {} }),
        anon.rpc('area_lead_summary'),
        anon.rpc('claim_client_access'),
        anon.rpc('affiliate_leads'),
        anon.rpc('admin_counters'),
        anon.rpc('request_upgrade', { p_to_pack_code: 'P3', p_extras: [] }),
        anon.rpc('crm_import_organizations', { p_rows: [] }),
        anon.rpc('admin_clients'),
        anon.rpc('admin_close_lead_paid', { p_lead_id: SEED.leads.marta, p_amount: 1 }),
        anon.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' }),
        anon.rpc('chat_purge_anonymous', { p_older_than: '90 days' }),
      ]);
      for (const { error } of calls) expect(error).toBeTruthy();
    });
  });

  describe('staff, profiles and catalogue (DATOS §5, 1.6)', () => {
    it('staff_members: each user reads only their own row', async () => {
      expect(await visible(jose, 'staff_members')).toBe(1);
      expect(await visible(ana, 'staff_members')).toBe(0);
    });

    it("user_profiles: ana reads hers and not bob's; admin reads every profile", async () => {
      const { data } = await ana.from('user_profiles').select('user_id');
      expect((data as Row[]).map((r) => r.user_id)).toEqual([ana.userId]);
      expect(await visible(jose, 'user_profiles')).toBeGreaterThanOrEqual(4);
    });

    it('user_profiles: first_audience is write-once and there is no insert', async () => {
      await bob.from('user_profiles').update({ first_audience: 'referral', first_audience_source: 'ref' }).eq('user_id', bob.userId).is('first_audience', null);
      const { error } = await bob.from('user_profiles').update({ first_audience: 'business' }).eq('user_id', bob.userId);
      expect(error?.message).toMatch(/write-once/);
      const insert = await bob.from('user_profiles').insert({ user_id: randomUUID() });
      expect(insert.error).toBeTruthy();
    });

    it('packs, pack_options and extras: authenticated reads, nobody writes', async () => {
      expect(await visible(ana, 'packs')).toBe(5);
      expect(await visible(bob, 'extras')).toBe(6);
      const { error } = await jose.from('packs').update({ price: 1 }).eq('code', 'P1');
      expect(error).toBeTruthy();
    });
  });

  describe('crm', () => {
    it('ana, bob and anon read 0 rows of every crm_* table and of leads', async () => {
      for (const c of [ana, bob, anon]) for (const t of [...CRM_TABLES, 'leads']) expect(await visible(c, t), t).toBe(0);
    });

    it('jose reads every crm_* table and the leads', async () => {
      expect(await visible(jose, 'crm_organizations')).toBeGreaterThanOrEqual(1);
      expect(await visible(jose, 'crm_contacts')).toBeGreaterThanOrEqual(5);
      expect(await visible(jose, 'crm_message_templates')).toBeGreaterThanOrEqual(8);
      expect(await visible(jose, 'leads')).toBeGreaterThanOrEqual(3);
    });

    it('contact status must match its kind', async () => {
      const { error } = await jose.from('crm_contacts').insert({ kind: 'agency', display_name: 'X', status: 'won', source: 'manual' });
      expect(error).toBeTruthy();
    });

    it('changing a status without next action fails; with it, logs an interaction', async () => {
      const id = await freshContact();
      const { error } = await jose.from('crm_contacts').update({ status: 'contacted' }).eq('id', id);
      expect(error?.message).toMatch(/next_action/);
      const ok = await jose
        .from('crm_contacts')
        .update({ status: 'contacted', next_action: 'call', next_action_at: new Date().toISOString() })
        .eq('id', id);
      expect(ok.error).toBeNull();
      const { data } = await jose.from('crm_interactions').select('kind,payload,actor').eq('contact_id', id).eq('kind', 'status_change');
      expect((data as Row[])[0]).toMatchObject({ payload: { from: 'new', to: 'contacted' }, actor: 'jose' });
    });

    it('a terminal status needs no next action', async () => {
      const id = await freshContact();
      const { error } = await jose.from('crm_contacts').update({ status: 'lost' }).eq('id', id);
      expect(error).toBeNull();
    });

    it('create_lead is idempotent, reuses the contact by email and enqueues lead.created', async () => {
      const email = `nuevo-${randomUUID()}@test`;
      const p = { email, display_name: 'Nuevo', source: 'web_form', via: 'client', locale: 'es', idempotency_key: randomUUID(), message: 'hola' };
      const a = await service.rpc('create_lead', { p });
      const b = await service.rpc('create_lead', { p });
      expect(a.error).toBeNull();
      expect((a.data as Row[])[0]?.created).toBe(true);
      expect((b.data as Row[])[0]?.lead_id).toBe((a.data as Row[])[0]?.lead_id);
      const c = await service.rpc('create_lead', { p: { ...p, email: email.toUpperCase(), idempotency_key: randomUUID() } });
      expect((c.data as Row[])[0]?.contact_id).toBe((a.data as Row[])[0]?.contact_id);
      const { count } = await jose.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('email', email);
      expect(count).toBe(1);
      // A logged-in user who types someone else's email never gets that contact linked (nor, later, its client).
      const typed = await service.rpc('create_lead', { p: { ...p, idempotency_key: randomUUID(), user_id: ana.userId } });
      const linked = await jose.from('crm_contacts').select('user_id').eq('id', (typed.data as Row[])[0]?.contact_id as string).single();
      expect(linked.data?.user_id).toBeNull();
      // Remove it: area_lead_summary returns ana's most recent lead, and the area test expects her seeded won lead.
      expect((await service.from('leads').delete().eq('id', (typed.data as Row[])[0]?.lead_id as string)).error).toBeNull();
      const { data: ob } = await service.rpc('outbox_claim', { p_limit: 200, p_worker: 'rls-test' });
      const events = (ob ?? []) as Row[];
      expect(events.some((e) => e.event === 'lead.created' && (e.payload as Row).id === (a.data as Row[])[0]?.lead_id)).toBe(true);
      await service.rpc('outbox_ack', { p_ids: events.map((e) => e.id), p_worker: 'rls-test' });
    });

    it('ana cannot call create_lead nor crm_import_organizations', async () => {
      expect((await ana.rpc('create_lead', { p: {} })).error).toBeTruthy();
      expect((await ana.rpc('crm_import_organizations', { p_rows: [] })).error?.message).toMatch(/forbidden|permission/);
    });

    it('import is idempotent by normalized name', async () => {
      const rows = [{ name: 'Agencia  Test', kind: 'agency', fit: 5 }];
      const a = await jose.rpc('crm_import_organizations', { p_rows: rows });
      expect((a.data as Row[])[0]).toMatchObject({ created: 0, updated: 1 });
      const { count } = await jose.from('crm_organizations').select('*', { count: 'exact', head: true }).eq('name_normalized', 'agencia test');
      expect(count).toBe(1);
    });

    it('jose inserts a manual lead; ana cannot', async () => {
      const contact = await freshContact();
      expect((await jose.from('leads').insert({ contact_id: contact, source: 'manual', pack_code: 'P1' })).error).toBeNull();
      expect((await ana.from('leads').insert({ contact_id: contact, source: 'manual' })).error).toBeTruthy();
    });

    it('admin_counters: forbidden to ana, seven counters for jose', async () => {
      expect((await ana.rpc('admin_counters')).error?.message).toMatch(/forbidden/);
      const { data, error } = await jose.rpc('admin_counters');
      expect(error).toBeNull();
      expect(Object.keys(data as Row).sort()).toEqual([
        'agencies_replied',
        'chat_unread',
        'comments_pending',
        'contacts_due',
        'leads_open',
        'rewards_pending',
        'upgrades_pending',
      ]);
    });
  });

  describe('area', () => {
    it('ana reads her client without notes_internal', async () => {
      const { error } = await ana.from('clients').select('id, pack_code, notes_internal');
      expect(error).toBeTruthy();
      const ok = await ana.from('clients').select('id, pack_code');
      expect(ok.data).toEqual([{ id: SEED.clients.ana, pack_code: 'P2' }]);
    });

    it('only jose reads every column of clients, through admin_clients()', async () => {
      expect((await jose.from('clients').select('notes_internal')).error?.code).toBe('42501');
      const { data, error } = await jose.rpc('admin_clients', { p_client_id: SEED.clients.ana });
      expect(error).toBeNull();
      expect((data as Row[])[0]).toMatchObject({ id: SEED.clients.ana, contact_id: SEED.contacts.ana, user_id: ana.userId, invite_email: 'ana@test' });
      expect(Object.keys((data as Row[])[0] ?? {})).toContain('notes_internal');
      for (const c of [ana, bob, sin]) expect((await c.rpc('admin_clients')).error?.message).toMatch(/forbidden/);
      expect((await anon.rpc('admin_clients')).error).toBeTruthy();
    });

    it('bob (no client) reads 0 clients/tasks; ana reads her tasks and only non-internal comments', async () => {
      for (const t of AREA_TABLES) expect(await visible(bob, t), t).toBe(0);
      expect(await visible(ana, 'client_tasks')).toBe(2);
      const { data } = await ana.from('client_task_comments').select('id, internal');
      expect((data as Row[]).every((c) => c.internal === false)).toBe(true);
      expect((data as Row[]).some((c) => c.id === SEED.taskComments.internal)).toBe(false);
      expect(await visible(ana, 'client_extras')).toBe(1);
    });

    it('ana inserts a non-internal comment; an internal one fails', async () => {
      const base = { client_id: SEED.clients.ana, task_id: SEED.tasks.anaPending, author_user_id: ana.userId, body: `ok ${randomUUID()}` };
      expect((await ana.from('client_task_comments').insert(base)).error).toBeNull();
      expect((await ana.from('client_task_comments').insert({ ...base, internal: true })).error).toBeTruthy();
      expect((await ana.from('client_task_comments').insert({ ...base, client_id: SEED.clients.invitedSin, task_id: null })).error).toBeTruthy();
    });

    it('ana cannot write her client, tasks or extras directly', async () => {
      const upd = await ana.from('clients').update({ project_phase: 'delivered' }).eq('id', SEED.clients.ana).select('id');
      expect(upd.data ?? []).toHaveLength(0);
      expect((await ana.from('client_tasks').insert({ client_id: SEED.clients.ana, title: 'x' })).error).toBeTruthy();
      expect((await ana.from('client_extras').insert({ client_id: SEED.clients.ana, extra_code: 'geo', status: 'active' })).error).toBeTruthy();
    });

    it('upgrade only through request_upgrade; price computed in DB (P2→P3 = 1100); one pending at a time', async () => {
      // Jose resolves what an earlier run left pending, so the test can run again on the same database.
      const reject = (id?: string) => {
        const q = jose.from('upgrade_requests').update({ status: 'rejected' }).eq('client_id', SEED.clients.ana).eq('status', 'pending');
        return id ? q.eq('id', id) : q;
      };
      expect((await reject()).error).toBeNull();
      const direct = await ana
        .from('upgrade_requests')
        .insert({ client_id: SEED.clients.ana, from_pack_code: 'P2', to_pack_code: 'P3', computed_price: 1, pricing_version: '2026-09-14' });
      expect(direct.error).toBeTruthy();
      const { data, error } = await ana.rpc('request_upgrade', { p_to_pack_code: 'P3', p_extras: [] });
      expect(error).toBeNull();
      const row = await ana.from('upgrade_requests').select('*').eq('id', data as string).single();
      expect(row.data).toMatchObject({ client_id: SEED.clients.ana, from_pack_code: 'P2', to_pack_code: 'P3', computed_price: 1100, status: 'pending' });
      const second = await ana.rpc('request_upgrade', { p_to_pack_code: null, p_extras: ['geo'] });
      expect(second.error).toMatchObject({ code: '23505', message: 'upgrade_already_pending' });
      const selfResolve = await ana.from('upgrade_requests').update({ status: 'rejected' }).eq('id', data as string).select('id');
      expect(selfResolve.data ?? []).toHaveLength(0);
      expect((await reject(data as string)).error).toBeNull();
      const extra = await ana.rpc('request_upgrade', { p_to_pack_code: null, p_extras: ['seo_basic'] });
      const extraRow = await ana.from('upgrade_requests').select('computed_price').eq('id', extra.data as string).single();
      expect(extraRow.data?.computed_price).toBe(250);
      expect((await reject(extra.data as string)).error).toBeNull();
      expect((await ana.rpc('request_upgrade', { p_to_pack_code: 'P1', p_extras: [] })).error?.message).toMatch(/not_an_upgrade/);
      expect((await bob.rpc('request_upgrade', { p_to_pack_code: 'P3', p_extras: [] })).error?.message).toMatch(/not_a_client/);
      expect(await visible(bob, 'upgrade_requests')).toBe(0);
    });

    it('sin@test cannot claim_client_access nor read area_lead_summary; ana gets her lead summary', async () => {
      expect((await sin.rpc('claim_client_access')).error?.message).toMatch(/email_not_confirmed/);
      expect((await sin.rpc('area_lead_summary')).error?.message).toMatch(/email_not_confirmed/);
      const { data: row } = await service.from('clients').select('user_id').eq('id', SEED.clients.invitedSin).single();
      expect(row?.user_id).toBeNull();
      const a = await ana.rpc('area_lead_summary');
      expect(a.data).toEqual([expect.objectContaining({ pack_code: 'P2', price_from: 1400, status: 'won' })]);
      expect(Object.keys((a.data as Row[])[0] ?? {}).sort()).toEqual(['created_at', 'pack_code', 'pack_option', 'price_from', 'status']);
      expect((await bob.rpc('area_lead_summary')).data).toEqual([]);
      expect((await bob.rpc('claim_client_access')).data).toBeNull();
      expect((await ana.rpc('claim_client_access')).data).toBe(SEED.clients.ana);
    });

    it('a confirmed user claims the client invited with their email (and its contact)', async () => {
      const email = `claim-${randomUUID()}@test`;
      const created = await service.auth.admin.createUser({ email, password: TEST_PASSWORD, email_confirm: true });
      expect(created.error).toBeNull();
      const userId = created.data.user?.id as string;
      const contact = await service.from('crm_contacts').insert({ kind: 'client', status: 'active_client', display_name: 'Claim', email, source: 'manual' }).select('id').single();
      const client = await service.from('clients').insert({ contact_id: contact.data?.id, invite_email: email.toUpperCase(), pack_code: 'P1' }).select('id').single();
      expect(client.error).toBeNull();
      const session = await clientFor('anon');
      await session.auth.signInWithPassword({ email, password: TEST_PASSWORD });
      const { data, error } = await session.rpc('claim_client_access');
      expect(error).toBeNull();
      expect(data).toBe(client.data?.id);
      const linked = await service.from('crm_contacts').select('user_id').eq('id', contact.data?.id).single();
      expect(linked.data?.user_id).toBe(userId);
    });

    it('storage: ana uploads under clients/<her id>/<asset id> only', async () => {
      const id = randomUUID();
      const path = `clients/${SEED.clients.ana}/${id}`;
      const row = await ana.from('client_assets').insert({ id, client_id: SEED.clients.ana, uploaded_by_user_id: ana.userId, source: 'client', storage_path: path, file_name: 'a.txt' });
      expect(row.error).toBeNull();
      const file = new Blob(['hello'], { type: 'text/plain' });
      expect((await ana.storage.from('client-assets').upload(path, file)).error).toBeNull();
      expect((await ana.storage.from('client-assets').upload(`clients/${SEED.clients.ana}/no-row-${randomUUID()}`, file)).error).toBeTruthy();
      expect((await ana.storage.from('client-assets').upload(`clients/${SEED.clients.invitedSin}/${randomUUID()}`, file)).error).toBeTruthy();
      expect((await bob.storage.from('client-assets').download(path)).error).toBeTruthy();
      expect((await ana.storage.from('client-assets').download(path)).error).toBeNull();
      // A valid path, so the refusal comes from RLS (source = 'admin') and not from the storage_path check.
      const adminId = randomUUID();
      const asAdmin = await ana.from('client_assets').insert({
        id: adminId,
        client_id: SEED.clients.ana,
        uploaded_by_user_id: ana.userId,
        source: 'admin',
        storage_path: `clients/${SEED.clients.ana}/${adminId}`,
      });
      expect(asAdmin.error?.code).toBe('42501');
      expect((await ana.storage.from('client-assets').remove([path])).error).toBeNull();
      expect((await ana.from('client_assets').delete().eq('id', id)).error).toBeNull();
    });
  });

  describe('affiliates and comments', () => {
    it('ana cannot change her level; affiliate_leads() returns referred leads without contact data', async () => {
      const upd = await ana.from('affiliates').update({ level: 'premium' }).eq('user_id', ana.userId).select('id');
      expect(upd.data ?? []).toHaveLength(0);
      const mine = await ana.from('affiliates').select('code, level');
      expect(mine.data).toEqual([{ code: 'ANA-TEST01', level: 'standard' }]);
      expect((await ana.from('affiliates').insert({ user_id: SEED.users.sin })).error).toBeTruthy();
      const { data } = await ana.rpc('affiliate_leads');
      expect((data as Row[]).some((l) => l.lead_id === SEED.leads.marta)).toBe(true);
      expect(Object.keys((data as Row[])[0] ?? {}).sort()).toEqual(['created_at', 'lead_id', 'pack_code', 'reward_status', 'status']);
    });

    it('bob reads his own reward and cannot create or pay one; ana reads none of his', async () => {
      const bobs = await bob.from('affiliate_rewards').select('id, affiliate_id');
      expect((bobs.data as Row[]).every((r) => r.affiliate_id === SEED.affiliates.bob)).toBe(true);
      expect((bobs.data as Row[]).some((r) => r.id === SEED.rewards.bobForAna)).toBe(true);
      expect((await ana.from('affiliate_rewards').select('id').eq('id', SEED.rewards.bobForAna)).data).toHaveLength(0);
      const ins = await bob.from('affiliate_rewards').insert({ affiliate_id: SEED.affiliates.bob, lead_id: SEED.leads.marta, type: 'percent', amount: 1 });
      expect(ins.error).toBeTruthy();
      expect(await visible(jose, 'affiliate_rewards')).toBeGreaterThanOrEqual(1);
    });

    it('admin_close_lead_paid creates client, reward and active_client status; rejects ana', async () => {
      expect((await ana.rpc('admin_close_lead_paid', { p_lead_id: SEED.leads.marta, p_amount: 1400 })).error?.message).toMatch(/forbidden/);
      const contact = await freshContact();
      const lead = await jose.from('leads').insert({ contact_id: contact, source: 'web_form', pack_code: 'P2', affiliate_code: 'ANA-TEST01' }).select('id').single();
      const { data, error } = await jose.rpc('admin_close_lead_paid', {
        p_lead_id: lead.data?.id,
        p_amount: 1400,
        p_reward_type: 'percent',
        p_reward_amount: 140,
        p_reward_percent: 10,
      });
      expect(error).toBeNull();
      const result = data as Row;
      expect(result.client_id).toBeTruthy();
      expect(result.reward_id).toBeTruthy();
      const c = await jose.from('crm_contacts').select('status').eq('id', contact).single();
      expect(c.data?.status).toBe('active_client');
      const l = await jose.from('leads').select('status, amount').eq('id', lead.data?.id).single();
      expect(l.data).toMatchObject({ status: 'won', amount: 1400 });
      const again = await jose.rpc('admin_close_lead_paid', { p_lead_id: lead.data?.id, p_amount: 1400 });
      expect(again.error?.message).toMatch(/lead_already_closed_or_missing/);
    });

    it('anon reads only approved comments; ana sees her pending; ana cannot insert approved', async () => {
      const pub = await anon.from('blog_comments').select('id, status');
      expect(pub.error).toBeNull();
      expect((pub.data as Row[]).every((c) => c.status === 'approved')).toBe(true);
      expect((await anon.from('blog_comments').select('user_id')).error).toBeTruthy();
      const mine = await ana.from('blog_comments').select('id, user_id, status').eq('status', 'pending');
      expect((mine.data as Row[]).every((c) => c.user_id === ana.userId)).toBe(true);
      expect((mine.data as Row[]).some((c) => c.id === SEED.blogComments.pendingAna)).toBe(true);
      const base = { post_slug: 'hello-world', locale: 'es', user_id: ana.userId, author_name: 'Ana', body: `rls ${randomUUID()}` };
      expect((await ana.from('blog_comments').insert({ ...base, status: 'approved' })).error).toBeTruthy();
      expect((await ana.from('blog_comments').insert({ ...base, parent_id: SEED.blogComments.pendingBob })).error).toBeTruthy();
      expect((await ana.from('blog_comments').insert({ ...base, parent_id: SEED.blogComments.approvedBob })).error).toBeNull();
      const mod = await ana.from('blog_comments').update({ status: 'approved' }).eq('id', SEED.blogComments.pendingAna).select('id');
      expect(mod.data ?? []).toHaveLength(0);
      expect(await visible(jose, 'blog_comments')).toBeGreaterThanOrEqual(3);
    });
  });

  describe('chat', () => {
    /** Inserts with the service role (the gateway) and returns the new row id. */
    async function serviceInsert(table: string, row: Row): Promise<string> {
      const { data, error } = await service.from(table).insert(row).select('id').single();
      expect(error).toBeNull();
      return (data as Row).id as string;
    }
    const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

    it('only one published context per case and locale', async () => {
      const { error } = await jose.from('chat_contexts').insert({ case: 'client', locale: 'es', version: 9, status: 'published', body_md: 'x' });
      expect(error?.code).toBe('23505');
      expect(error?.message).toMatch(/unique|duplicate/);
    });

    it('chat_contexts: ana, bob and anon read none; jose reads all, drafts included', async () => {
      for (const c of [ana, bob, anon]) expect(await visible(c, 'chat_contexts')).toBe(0);
      const { data } = await jose.from('chat_contexts').select('id');
      expect((data as Row[]).map((r) => r.id)).toEqual(expect.arrayContaining(Object.values(SEED.chatContexts)));
      expect((await ana.from('chat_contexts').insert({ case: 'client', locale: 'en', version: 1, body_md: 'x' })).error?.code).toBe('42501');
    });

    it('chat_context_published is callable only by service role and returns null when unpublished', async () => {
      expect((await ana.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' })).error?.code).toBe('42501');
      expect((await anon.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' })).error).toBeTruthy();
      expect((await service.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' })).data).toMatchObject({ version: 1 });
      expect((await service.rpc('chat_context_published', { p_case: 'partner', p_locale: 'es' })).data).toBeNull();
    });

    it('ana reads only her thread and its messages; bob and anon read none; jose reads the anonymous one', async () => {
      const threads = await ana.from('chat_threads').select('id');
      expect((threads.data as Row[]).map((r) => r.id)).toEqual([SEED.chatThreads.ana]);
      const messages = await ana.from('chat_messages').select('thread_id');
      expect((messages.data as Row[]).length).toBeGreaterThanOrEqual(2);
      expect((messages.data as Row[]).every((m) => m.thread_id === SEED.chatThreads.ana)).toBe(true);
      for (const c of [bob, anon]) for (const t of ['chat_threads', 'chat_messages']) expect(await visible(c, t), t).toBe(0);
      const anonymous = await jose.from('chat_threads').select('id, user_id, contact_id').eq('id', SEED.chatThreads.anonymous).single();
      expect(anonymous.data).toMatchObject({ user_id: null, contact_id: null });
      expect(await visible(jose, 'chat_messages')).toBeGreaterThanOrEqual(4);
    });

    it('messages are written by the gateway and by jose as jose only; nobody updates them', async () => {
      const msg = (sender_role: string) => ({ thread_id: SEED.chatThreads.ana, sender_role, content: `rls ${randomUUID()}` });
      expect((await ana.from('chat_messages').insert(msg('visitor'))).error?.code).toBe('42501');
      expect((await ana.from('chat_messages').insert(msg('jose'))).error?.code).toBe('42501');
      expect((await jose.from('chat_messages').insert(msg('assistant'))).error?.code).toBe('42501');
      expect((await jose.from('chat_messages').insert(msg('jose'))).error).toBeNull();
      expect((await jose.from('chat_messages').update({ content: 'x' }).eq('thread_id', SEED.chatThreads.ana)).error?.code).toBe('42501');
      const upd = await ana.from('chat_threads').update({ ai_enabled: false }).eq('id', SEED.chatThreads.ana).select('id');
      expect(upd.data ?? []).toHaveLength(0);
    });

    it('a visitor message marks the thread unread and enqueues chat.visitor_message', async () => {
      const thread = await serviceInsert('chat_threads', { visitor_id: randomUUID(), case: 'curious', locale: 'es', origin_path: '/' });
      const message = await serviceInsert('chat_messages', { thread_id: thread, sender_role: 'visitor', content: 'hola' });
      const row = await jose.from('chat_threads').select('unread_for_admin, last_message_at').eq('id', thread).single();
      expect(row.data).toMatchObject({ unread_for_admin: true });
      expect(row.data?.last_message_at).toBeTruthy();
      const counters = await jose.rpc('admin_counters');
      expect((counters.data as Row).chat_unread).toBeGreaterThanOrEqual(1);
      const { data: ob } = await service.rpc('outbox_claim', { p_limit: 200, p_worker: 'rls-test' });
      const events = (ob ?? []) as Row[];
      const event = events.find((e) => e.event === 'chat.visitor_message' && (e.payload as Row).id === message);
      expect(event?.payload).toMatchObject({ thread_id: thread, case: 'curious', locale: 'es' });
      expect(event?.payload).not.toHaveProperty('content');
      await service.rpc('outbox_ack', { p_ids: events.map((e) => e.id), p_worker: 'rls-test' });
      expect((await service.from('chat_threads').delete().eq('id', thread)).error).toBeNull();
    });

    it('chat_purge_anonymous deletes only anonymous threads without contact older than the interval', async () => {
      const old = await serviceInsert('chat_threads', { visitor_id: randomUUID(), case: 'curious', locale: 'es', created_at: daysAgo(120) });
      const recent = await serviceInsert('chat_threads', { visitor_id: randomUUID(), case: 'curious', locale: 'es', created_at: daysAgo(120) });
      await serviceInsert('chat_messages', { thread_id: recent, sender_role: 'visitor', content: 'still here', created_at: daysAgo(3) });
      const linked = await serviceInsert('chat_threads', {
        visitor_id: randomUUID(),
        contact_id: SEED.contacts.recruiter,
        case: 'recruiter',
        locale: 'en',
        created_at: daysAgo(120),
      });
      expect((await ana.rpc('chat_purge_anonymous', { p_older_than: '90 days' })).error?.code).toBe('42501');
      expect((await service.rpc('chat_purge_anonymous', { p_older_than: '1 hour' })).error?.message).toMatch(/interval_too_short/);
      const { data, error } = await service.rpc('chat_purge_anonymous', { p_older_than: '90 days' });
      expect(error).toBeNull();
      expect(data).toBeGreaterThanOrEqual(1);
      const left = await service.from('chat_threads').select('id').in('id', [old, recent, linked, SEED.chatThreads.anonymous, SEED.chatThreads.ana]);
      expect((left.data as Row[]).map((r) => r.id).sort()).toEqual([recent, linked, SEED.chatThreads.anonymous, SEED.chatThreads.ana].sort());
      expect((await service.from('chat_threads').delete().in('id', [recent, linked])).error).toBeNull();
    });

    it('chat_context_publish archives the published version and publishes the new one, admin only', async () => {
      const draft = { p_id: SEED.chatContexts.partnerEsDraft };
      for (const c of [ana, service]) expect((await c.rpc('chat_context_publish', draft)).error?.code).toBe('42501');
      expect((await anon.rpc('chat_context_publish', draft)).error).toBeTruthy();
      const v2 = randomUUID();
      expect((await jose.from('chat_contexts').insert({ id: v2, case: 'client', locale: 'es', version: 9000 + Math.floor(Math.random() * 999), body_md: 'rls' })).error).toBeNull();
      try {
        const { data, error } = await jose.rpc('chat_context_publish', { p_id: v2 });
        expect(error).toBeNull();
        expect(data).toMatchObject({ id: v2, archived_version: 1 });
        expect((await service.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' })).data).toMatchObject({ body_md: 'rls' });
      } finally {
        expect((await jose.rpc('chat_context_publish', { p_id: SEED.chatContexts.clientEs })).error).toBeNull();
        expect((await jose.from('chat_contexts').delete().eq('id', v2)).error).toBeNull();
      }
      expect((await service.rpc('chat_context_published', { p_case: 'client', p_locale: 'es' })).data).toMatchObject({ version: 1 });
    });
  });

  describe('service role RPCs (1.6)', () => {
    it('increment_quota counts against the limit; authenticated and anon cannot call it', async () => {
      const key = `test:${randomUUID()}`;
      const call = () => service.rpc('increment_quota', { p_key: key, p_limit: 2, p_ttl: '1 hour' });
      expect((await call()).data).toBe(true);
      expect((await call()).data).toBe(true);
      expect((await call()).data).toBe(false);
      expect((await ana.rpc('increment_quota', { p_key: key, p_limit: 1, p_ttl: '1 hour' })).error).toBeTruthy();
    });

    it('scheduled_jobs_due lists the launch jobs for the service role only', async () => {
      const { data, error } = await service.rpc('scheduled_jobs_due', { p_now: new Date(Date.now() + 86_400_000).toISOString() });
      expect(error).toBeNull();
      expect((data as Row[]).find((j) => j.name === 'outbox.drain')).toMatchObject({ cron: '* * * * *' });
      expect((await ana.rpc('scheduled_jobs_due', { p_now: new Date().toISOString() })).error).toBeTruthy();
    });
  });
});
