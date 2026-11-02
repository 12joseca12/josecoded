// @vitest-environment node
// RLS with four accounts against Supabase local: one assertion per cell of DATOS v1.2 §5 (plan v3.2, tasks 1.6, 1.8a
// and 1.8b) plus the RPC behaviours of the 1.8a and 1.8b test extracts. Needs `supabase start` + `supabase db reset` (migrations +
// seed). Skipped with a warning when the stack does not answer locally, and a failure in CI (same criterion as
// packages/types/test/database-drift.test.ts). The SQL twin that runs without Supabase is supabase/test/pg/.
// The tests write through PostgREST (no rollback), so whatever they create uses fresh ids and keys: they can run
// again on the same database without a reset.
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  LOCAL_URL,
  SEED,
  TEST_PASSWORD,
  cleanupTestFactors,
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

afterAll(async () => {
  if (up) await cleanupTestFactors();
});

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
    it('staff_members: the admin reads every row (jose, carla, dani), the others only their own', async () => {
      expect(await visible(jose, 'staff_members')).toBe(3);
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
      expect(await visible(ana, 'packs')).toBe(5); // P1-P5: the hidden test pack is for staff and for the client that bought it
      expect((await bob.from('packs').select('code').eq('code', 'HIDDEN_PACK')).data).toEqual([]);
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

    it('admin_counters: forbidden to ana, thirteen counters for jose (seven of C1 plus six of 1.8e)', async () => {
      expect((await ana.rpc('admin_counters')).error?.message).toMatch(/forbidden/);
      const { data, error } = await jose.rpc('admin_counters');
      expect(error).toBeNull();
      expect(Object.keys(data as Row).sort()).toEqual([
        'agencies_replied',
        'chat_unread',
        'commissions_pending',
        'comments_pending',
        'contacts_due',
        'content_pending',
        'import_conflicts_pending',
        'imports_failed_24h',
        'leads_open',
        'quotes_draft',
        'rewards_pending',
        'stories_proposed',
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

// ---------------------------------------------------------------------------------------------------------------------
// Task 1.8e (plan v3.4; DATOS v1.4 §14.3 matrix and §14.9 criteria 1-6, 9-11): closers carla (active, 10 %) and dani
// (switched off, 15 %), the sharing model, aal2 in the database, imports and conflicts, commissions with a frozen
// percent, stories, content, the price catalogue and quotes. Staff clients carry aal2 (see clientFor); `*1` are the
// password-only tokens. Everything created here uses fresh ids/keys and cleans up with the service role, so the file
// can run again on the same database. The SQL twin (supabase/test/pg/closers.test.sql) checks the same cells in a
// rollback and also covers what cannot be undone through PostgREST.
describe.skipIf(!up && !inCi)('RLS with closers: carla (active), dani (switched off), aal1 tokens', () => {
  let jose: TestClient;
  let jose1: TestClient;
  let ana: TestClient;
  let bob: TestClient;
  let carla: TestClient;
  let carla1: TestClient;
  let dani: TestClient;
  let anon: TestClient;
  const service = serviceClient();

  beforeAll(async () => {
    expect(up, `Supabase local must be running in CI (${LOCAL_URL})`).toBe(true);
    jose = await clientFor('jose');
    jose1 = await clientFor('jose', { aal: 'aal1' });
    ana = await clientFor('ana');
    bob = await clientFor('bob');
    carla = await clientFor('carla');
    carla1 = await clientFor('carla', { aal: 'aal1' });
    dani = await clientFor('dani');
    anon = await clientFor('anon');
  }, 60_000);

  const ids = (data: unknown): string[] => ((data ?? []) as Row[]).map((r) => r.id as string);
  const hex = () => randomUUID().replace(/-/gu, '').slice(0, 8).toUpperCase();

  async function mustInsert(table: string, row: Row): Promise<string> {
    const { data, error } = await service.from(table).insert(row).select('id').single();
    expect(error, `${table}: ${error?.message}`).toBeNull();
    return (data as Row).id as string;
  }

  describe('aal2 is enforced by the database (a stolen aal1 cookie reads nothing)', () => {
    it('jose with aal1 reads 0 rows of the CRM and cannot call admin RPCs', async () => {
      for (const table of ['crm_contacts', 'leads', 'crm_interactions', 'clients', 'closer_commissions', 'custom_quotes', 'notification_rules']) {
        expect(await visible(jose1, table), table).toBe(0);
      }
      expect((await jose1.rpc('admin_counters')).error?.code).toBe('42501');
      expect((await jose1.rpc('admin_staff_list')).error?.code).toBe('42501');
      expect((await jose1.rpc('content_publish')).error?.code).toBe('42501');
      // His own staff row stays readable: the web needs it to ask for the second factor.
      expect(await visible(jose1, 'staff_members', 'user_id')).toBe(1);
    });

    it('carla with aal1 reads 0 rows and cannot import nor ask for a telegram code', async () => {
      for (const table of ['crm_contacts', 'leads', 'crm_imports', 'closer_commissions', 'custom_quotes', 'clients']) {
        expect(await visible(carla1, table), table).toBe(0);
      }
      const csv = { p_rows: [], p_file_name: 'a.csv', p_checksum: randomUUID() };
      expect((await carla1.rpc('crm_import_contacts_csv', csv)).error?.code).toBe('42501');
      expect((await carla1.rpc('staff_telegram_begin')).error?.code).toBe('42501');
    });

    it('the same accounts with aal2 do read (the elevation works)', async () => {
      expect(await visible(jose, 'crm_contacts')).toBeGreaterThanOrEqual(9);
      expect(await visible(carla, 'crm_contacts')).toBeGreaterThanOrEqual(3);
    });
  });

  describe("carla: only her portfolio (DATOS §14.3)", () => {
    it("sees her 3 contacts and not one of Jose's or dani's", async () => {
      const { data, error } = await carla.from('crm_contacts').select('id, owner_id');
      expect(error).toBeNull();
      const rows = data as Row[];
      expect(rows.length).toBeGreaterThanOrEqual(3);
      expect(rows.every((r) => r.owner_id === carla.userId)).toBe(true);
      const foreign: string[] = [SEED.contacts.marta, SEED.contacts.ana, SEED.contacts.agency, SEED.contacts.recruiter, SEED.contacts.invitedSin, SEED.contacts.dani];
      expect(rows.some((r) => foreign.includes(r.id as string))).toBe(false);
      expect((await carla.from('crm_contacts').select('id').eq('id', SEED.contacts.marta)).data).toHaveLength(0);
    });

    it("sees the leads of her contacts and none of Jose's interactions", async () => {
      const { data } = await carla.from('leads').select('id, contact_id');
      const rows = data as Row[];
      expect(ids(rows)).toEqual(expect.arrayContaining([SEED.leads.carlaWon, SEED.leads.carlaOpen]));
      expect(rows.some((r) => r.contact_id === SEED.contacts.marta)).toBe(false);
      const interactions = await carla.from('crm_interactions').select('contact_id');
      expect(((interactions.data ?? []) as Row[]).some((r) => r.contact_id === SEED.contacts.ana)).toBe(false);
    });

    it('reads the global data and creates organisations but changes none', async () => {
      expect(await visible(carla, 'crm_organizations')).toBeGreaterThanOrEqual(1);
      expect(await visible(carla, 'crm_message_templates')).toBe(8);
      expect(await visible(carla, 'packs', 'code')).toBe(6); // staff read the hidden pack too
      const created = await carla.from('crm_organizations').insert({ name: `Org ${hex()}`, kind: 'agency' }).select('id').single();
      expect(created.error).toBeNull();
      const upd = await carla.from('crm_organizations').update({ fit: 5 }).eq('id', SEED.orgs.agenciaTest).select('id');
      expect(upd.data ?? []).toHaveLength(0);
      const tpl = await carla.from('crm_message_templates').update({ body: 'x' }).neq('code', '').select('id');
      expect(tpl.data ?? []).toHaveLength(0);
      await service.from('crm_organizations').delete().eq('id', (created.data as Row).id as string);
    });

    it('cannot reassign, win by hand, link a user, nor insert without being the owner', async () => {
      const id = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Carla ${hex()}`, source: 'manual', owner_id: carla.userId });
      try {
        expect((await carla.from('crm_contacts').update({ owner_id: null }).eq('id', id)).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').update({ owner_id: dani.userId }).eq('id', id)).error?.code).toBe('42501');
        const win = { status: 'won', next_action_at: new Date().toISOString() };
        expect((await carla.from('crm_contacts').update(win).eq('id', id)).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').update({ status: 'active_client' }).eq('id', id)).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').update({ user_id: ana.userId }).eq('id', id)).error?.code).toBe('42501');
        const next = { status: 'contacted', next_action: 'call', next_action_at: new Date(Date.now() + 86_400_000).toISOString() };
        const ok = await carla.from('crm_contacts').update(next).eq('id', id).select('id');
        expect(ok.error).toBeNull();
        expect(ok.data).toHaveLength(1);
        const base = { kind: 'lead', status: 'new', source: 'manual' };
        expect((await carla.from('crm_contacts').insert({ ...base, display_name: `X ${hex()}` })).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').insert({ ...base, display_name: `X ${hex()}`, owner_id: dani.userId })).error?.code).toBe('42501');
        const own = await carla.from('crm_contacts').insert({ ...base, display_name: `Own ${hex()}`, owner_id: carla.userId }).select('id').single();
        expect(own.error).toBeNull();
        await service.from('crm_contacts').delete().eq('id', (own.data as Row).id as string);
        // Delete is admin only: 0 rows for her.
        expect((await carla.from('crm_contacts').delete().eq('id', id).select('id')).data ?? []).toHaveLength(0);
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', id);
        await service.from('crm_contacts').delete().eq('id', id);
      }
    });

    it('cannot win a lead, put an amount or an affiliate on it; she can lose it', async () => {
      const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Lead ${hex()}`, source: 'manual', owner_id: carla.userId });
      const lead = await mustInsert('leads', { contact_id: contact, source: 'manual', pack_code: 'P1' });
      try {
        expect((await carla.from('leads').update({ status: 'won' }).eq('id', lead)).error?.code).toBe('42501');
        expect((await carla.from('leads').update({ amount: 5000 }).eq('id', lead)).error?.code).toBe('42501');
        expect((await carla.from('leads').update({ affiliate_code: 'ANA-TEST01' }).eq('id', lead)).error?.code).toBe('42501');
        expect((await carla.from('leads').update({ status: 'lost' }).eq('id', lead).select('id')).data).toHaveLength(1);
        expect((await carla.from('leads').update({ message: 'x' }).eq('id', SEED.leads.marta).select('id')).data ?? []).toHaveLength(0);
      } finally {
        await service.from('leads').delete().eq('id', lead);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it("request close and portal invitation work on her own and are forbidden on Jose's", async () => {
      expect((await carla.rpc('crm_request_close', { p_lead_id: SEED.leads.marta })).error?.message).toMatch(/forbidden/);
      expect((await carla.rpc('crm_request_close', { p_lead_id: SEED.leads.carlaWon })).error?.message).toMatch(/lead_not_open/);
      expect((await carla.rpc('invite_client_access', { p_client_id: SEED.clients.ana, p_email: 'x@example.test' })).error?.message).toMatch(/forbidden/);
      expect((await carla.rpc('invite_client_access', { p_client_id: SEED.clients.carla, p_email: 'no-arroba' })).error?.message).toMatch(/invalid_email/);
      // Security review: the invitation goes to the contact's email; a closer cannot choose another address.
      expect((await carla.rpc('invite_client_access', { p_client_id: SEED.clients.carla, p_email: 'carla-alt@example.test' })).error?.message).toMatch(/email_must_match_contact/);
      const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Close ${hex()}`, source: 'manual', owner_id: carla.userId });
      const lead = await mustInsert('leads', { contact_id: contact, source: 'manual', pack_code: 'P1' });
      try {
        expect((await carla.rpc('crm_request_close', { p_lead_id: lead })).error).toBeNull();
        const { data } = await carla.from('crm_contacts').select('next_action').eq('id', contact).single();
        expect((data as Row).next_action).toBe('Jose: cerrar cobrado');
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', contact);
        await service.from('leads').delete().eq('id', lead);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it('cannot redirect the portal invitation: no email change once there is a lead or client, frozen invite_email, throttle', async () => {
      const contact = await mustInsert('crm_contacts', { kind: 'client', status: 'active_client', display_name: `Portal ${hex()}`, email: `portal-${hex()}@example.test`, source: 'manual', owner_id: carla.userId });
      const frozen = (await service.from('crm_contacts').select('email').eq('id', contact).single()).data as Row;
      const client = await mustInsert('clients', { contact_id: contact, invite_email: frozen.email, pack_code: 'P1' });
      try {
        // The exploit: patch the email, then ask for the invitation. The patch is refused and the invite stays on the frozen address.
        expect((await carla.from('crm_contacts').update({ email: 'atacante@evil.test' }).eq('id', contact)).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').update({ email: 'atacante@evil.test' }).eq('id', SEED.contacts.carlaLead)).error?.code).toBe('42501');
        expect((await carla.rpc('invite_client_access', { p_client_id: client, p_email: 'atacante@evil.test' })).error?.message).toMatch(/email_must_match_contact/);
        expect((await carla.rpc('invite_client_access', { p_client_id: client, p_email: '' })).error).toBeNull();
        // Re-sending within 10 minutes is refused.
        expect((await carla.rpc('invite_client_access', { p_client_id: client, p_email: '' })).error?.message).toMatch(/invite_recently_sent/);
        // Even if the contact email moved (an admin fix), the closer still invites the frozen address.
        await service.from('crm_contacts').update({ email: `otro-${hex()}@example.test` }).eq('id', contact);
        expect((await carla.rpc('invite_client_access', { p_client_id: client, p_email: String(frozen.email) })).error?.message).toMatch(/invite_recently_sent/);
        // The generic error for a staff address and the admin's exemption from the throttle are asserted in supabase/test/pg/security.test.sql.
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', contact);
        await service.from('clients').delete().eq('id', client);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it('cannot swap the pack of a lead that already has one', async () => {
      const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Pack ${hex()}`, source: 'manual', owner_id: carla.userId });
      const lead = await mustInsert('leads', { contact_id: contact, source: 'manual' });
      try {
        expect((await carla.from('leads').update({ pack_code: 'P1' }).eq('id', lead).select('id')).data).toHaveLength(1);
        expect((await carla.from('leads').update({ pack_code: 'P2' }).eq('id', lead)).error?.code).toBe('42501');
        expect((await carla.from('leads').update({ pack_option: 'x' }).eq('id', lead)).error?.code).toBe('42501');
        expect((await carla.from('leads').update({ pack_code: 'P1' }).eq('id', SEED.leads.carlaOpen)).error?.code).toBe('42501');
        expect((await jose.from('leads').update({ pack_code: 'P2' }).eq('id', lead).select('id')).data).toHaveLength(1);
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', contact);
        await service.from('leads').delete().eq('id', lead);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it('reads her client without notes_internal nor CRM links; staff_clients() returns hers only', async () => {
      const own = await carla.from('clients').select('id, pack_code');
      expect(own.error).toBeNull();
      expect(ids(own.data)).toEqual([SEED.clients.carla]);
      expect((await carla.from('clients').select('notes_internal')).error?.code).toBe('42501');
      expect((await carla.from('clients').select('contact_id')).error?.code).toBe('42501');
      const { data } = await carla.rpc('staff_clients');
      expect(ids(data)).toEqual([SEED.clients.carla]);
      expect(Object.keys((data as Row[])[0] ?? {})).not.toContain('notes_internal');
      // Ana's client belongs to Jose.
      for (const table of ['client_tasks', 'client_task_comments', 'client_assets', 'client_user_stories']) {
        expect(await visible(carla, table), table).toBe(0);
      }
    });

    it('sees her own staff row without notes, no invitations, no content, only the rules that reach her', async () => {
      const { data } = await carla.from('staff_members').select('user_id, commission_rate, disabled_at');
      expect(data).toEqual([expect.objectContaining({ user_id: carla.userId, commission_rate: 10, disabled_at: null })]);
      expect((await carla.from('staff_members').select('notes')).error?.code).toBe('42501');
      const raise = await carla.from('staff_members').update({ commission_rate: 99 }).eq('user_id', carla.userId!).select('user_id');
      expect(raise.data ?? []).toHaveLength(0);
      expect(await visible(carla, 'staff_invites')).toBe(0);
      expect(await visible(carla, 'site_content_entries')).toBe(0);
      expect(await visible(carla, 'pricing_price_history')).toBe(0);
      const rules = (await carla.from('notification_rules').select('recipient')).data as Row[];
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.recipient === 'owner')).toBe(true);
    });

    it('cannot use the admin RPCs of staff, content, pricing, commissions and conflicts', async () => {
      const calls = await Promise.all([
        carla.rpc('admin_staff_list'),
        carla.rpc('admin_staff_set', { p_user_id: carla.userId, p_disabled: false, p_commission_rate: 99, p_notes: null }),
        carla.rpc('admin_reassign_contacts', { p_from: carla.userId, p_to: null }),
        carla.rpc('admin_staff_invite', { p_email: 'x@example.test', p_role: 'closer', p_commission_rate: 10 }),
        carla.rpc('content_publish'),
        carla.rpc('admin_pricing_set_pack', { p: { code: 'P2', price: 1500 } }),
        carla.rpc('admin_commission_approve', { p_id: SEED.commissions.carla }),
        carla.rpc('admin_commission_mark_paid', { p_id: SEED.commissions.carla, p_paid_at: null, p_note: null }),
        carla.rpc('admin_import_conflict_resolve', { p_id: SEED.conflicts.carlaMarta, p_resolution: 'assign_importer' }),
        carla.rpc('admin_import_conflicts'),
        carla.rpc('admin_counters'),
      ]);
      for (const { error } of calls) expect(error?.code).toBe('42501');
    });
  });

  describe('dani (switched off): 0 rows everywhere, aal2 or not', () => {
    it('owns a contact and still reads nothing of the CRM, the catalogue, imports or clients', async () => {
      const tables = ['crm_contacts', 'leads', 'crm_interactions', 'crm_organizations', 'crm_message_templates', 'crm_imports', 'clients', 'custom_quotes', 'notification_rules', 'client_user_stories'];
      for (const table of tables) expect(await visible(dani, table), table).toBe(0);
      for (const table of ['packs', 'extras']) expect(await visible(dani, table, 'code'), table).toBe(0);
      expect(await visible(dani, 'pack_options', 'pack_code')).toBe(0);
    });

    it('sees his own staff row with disabled_at, and cannot import, ask for a code, or read the counters', async () => {
      const { data } = await dani.from('staff_members').select('user_id, disabled_at');
      expect(data).toHaveLength(1);
      expect(((data as Row[])[0] as Row).disabled_at).not.toBeNull();
      const csv = { p_rows: [], p_file_name: 'a.csv', p_checksum: randomUUID() };
      expect((await dani.rpc('crm_import_contacts_csv', csv)).error?.code).toBe('42501');
      expect((await dani.rpc('staff_telegram_begin')).error?.code).toBe('42501');
      expect((await dani.rpc('crm_team_counters')).error?.code).toBe('42501');
      expect((await dani.rpc('crm_my_counters')).error?.code).toBe('42501');
    });
  });

  describe('import CSV (Q22): idempotent, leak-free, conflicts go to the admin', () => {
    it('creates, is idempotent by checksum and rejects 501 rows', async () => {
      const marker = hex();
      const checksum = randomUUID();
      const rows = [
        { display_name: `Nuevo ${marker}`, email: `nuevo-${marker}@example.test`, kind: 'lead', tags: ['csv'] },
        { display_name: '', email: `bad-${marker}@example.test` },
      ];
      const first = await carla.rpc('crm_import_contacts_csv', { p_rows: rows, p_file_name: 'a.csv', p_checksum: checksum });
      expect(first.error).toBeNull();
      expect(first.data).toMatchObject({ created: 1, updated: 0, skipped: 1, conflicts: 0 });
      const other = [{ display_name: 'Otro', email: `otro-${marker}@example.test` }];
      const again = await carla.rpc('crm_import_contacts_csv', { p_rows: other, p_file_name: 'a.csv', p_checksum: checksum });
      expect((again.data as Row).import_id).toBe((first.data as Row).import_id);
      expect(again.data).toMatchObject({ created: 1, replayed: true });
      expect((await carla.from('crm_contacts').select('id').eq('email', `otro-${marker}@example.test`)).data).toHaveLength(0);
      const big = Array.from({ length: 501 }, (_, i) => ({ display_name: `N${i}`, email: `n${i}-${marker}@example.test` }));
      const tooMany = await carla.rpc('crm_import_contacts_csv', { p_rows: big, p_file_name: 'big.csv', p_checksum: randomUUID() });
      expect(tooMany.error?.message).toMatch(/too_many_rows/);
      await service.from('crm_interactions').delete().in('contact_id', ids((await service.from('crm_contacts').select('id').eq('email', `nuevo-${marker}@example.test`)).data));
      await service.from('crm_contacts').delete().eq('email', `nuevo-${marker}@example.test`);
      await service.from('crm_imports').delete().eq('id', (first.data as Row).import_id as string);
    });

    it('a row owned by Jose goes to the queue: nothing leaks, the contact is untouched, carla never sees the other side', async () => {
      const marker = hex();
      const email = `jose-${marker}@example.test`;
      const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `De Jose ${marker}`, email, source: 'manual' });
      const res = await carla.rpc('crm_import_contacts_csv', {
        p_rows: [{ display_name: 'Intruso', email, role: 'CEO', tags: ['csv'] }],
        p_file_name: 'b.csv',
        p_checksum: randomUUID(),
      });
      const importId = (res.data as Row | null)?.import_id as string | undefined;
      try {
        expect(res.error).toBeNull();
        expect(res.data).toMatchObject({ created: 0, updated: 0, conflicts: 1 });
        expect(JSON.stringify(res.data)).not.toMatch(/Jose|jose|owner/u);
        expect(JSON.stringify(res.data)).not.toContain(contact);
        const untouched = await service.from('crm_contacts').select('display_name, role, owner_id').eq('id', contact).single();
        expect(untouched.data).toEqual({ display_name: `De Jose ${marker}`, role: null, owner_id: null });
        const queue = await carla.from('crm_import_conflicts').select('id, status, row_index, row').eq('import_id', importId!);
        expect(queue.data).toHaveLength(1);
        const conflictId = ((queue.data as Row[])[0] as Row).id as string;
        expect(((queue.data as Row[])[0] as Row).status).toBe('pending');
        for (const col of ['existing_contact_id', 'existing_owner_id', 'resolution_note']) {
          expect((await carla.from('crm_import_conflicts').select(col)).error?.code, col).toBe('42501');
        }
        // The admin sees both sides and assigns the contact to the importer.
        const mine = ((await jose.rpc('admin_import_conflicts')).data as Row[]).find((r) => r.id === conflictId);
        expect(mine).toMatchObject({ existing_contact_id: contact, importer_user_id: carla.userId });
        expect((await jose.rpc('admin_import_conflict_resolve', { p_id: conflictId, p_resolution: 'assign_importer', p_note: 'ok' })).error).toBeNull();
        expect((await carla.from('crm_contacts').select('id, role').eq('id', contact)).data).toEqual([{ id: contact, role: 'CEO' }]);
        const twice = await jose.rpc('admin_import_conflict_resolve', { p_id: conflictId, p_resolution: 'discard' });
        expect(twice.error?.message).toMatch(/conflict_not_pending/);
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', contact);
        if (importId) await service.from('crm_imports').delete().eq('id', importId);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it('carla reads her seeded import and pending row; the admin view works for jose', async () => {
      expect(ids((await carla.from('crm_imports').select('id')).data)).toContain(SEED.imports.carla);
      expect(ids((await carla.from('crm_import_conflicts').select('id')).data)).toContain(SEED.conflicts.carlaMarta);
      const queue = (await jose.rpc('admin_import_conflicts')).data;
      expect(queue).toEqual(expect.arrayContaining([expect.objectContaining({ id: SEED.conflicts.carlaMarta })]));
    });
  });

  describe('commissions (Q21): the percent is frozen on each row', () => {
    it('carla reads hers (10 %), cannot edit or approve it; ana, bob and anon see none', async () => {
      const mine = await carla.from('closer_commissions').select('id, percent, amount, status');
      const expected = expect.objectContaining({ id: SEED.commissions.carla, percent: 10, amount: 100, status: 'pending' });
      expect(mine.data).toEqual(expect.arrayContaining([expected]));
      expect((await carla.from('closer_commissions').update({ status: 'approved' }).eq('id', SEED.commissions.carla)).error?.code).toBe('42501');
      expect((await carla.rpc('admin_commission_approve', { p_id: SEED.commissions.carla })).error?.message).toMatch(/forbidden/);
      for (const c of [ana, bob, anon]) expect(await visible(c, 'closer_commissions'), 'closer_commissions').toBe(0);
    });

    it('closing a lead of carla creates the commission at the current rate; a later rate change does not rewrite it', async () => {
      const mkLead = async () => {
        const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Cierre ${hex()}`, source: 'manual', owner_id: carla.userId });
        const lead = await mustInsert('leads', { contact_id: contact, source: 'manual', pack_code: 'P1' });
        return { contact, lead };
      };
      const a = await mkLead();
      const b = await mkLead();
      try {
        expect((await jose.rpc('admin_close_lead_paid', { p_lead_id: a.lead, p_amount: 1400, p_generate_reward: false, p_commission: true })).error).toBeNull();
        const first = await carla.from('closer_commissions').select('percent, amount, status').eq('lead_id', a.lead).single();
        expect(first.data).toEqual({ percent: 10, amount: 140, status: 'pending' });
        const raise = { p_user_id: carla.userId, p_disabled: false, p_commission_rate: 20, p_notes: null };
        expect((await jose.rpc('admin_staff_set', raise)).error).toBeNull();
        expect((await jose.rpc('admin_close_lead_paid', { p_lead_id: b.lead, p_amount: 1000, p_generate_reward: false, p_commission: true })).error).toBeNull();
        const second = await carla.from('closer_commissions').select('percent, amount').eq('lead_id', b.lead).single();
        expect(second.data).toEqual({ percent: 20, amount: 200 });
        const firstAgain = await carla.from('closer_commissions').select('percent, amount').eq('lead_id', a.lead).single();
        expect(firstAgain.data).toEqual({ percent: 10, amount: 140 });
        // Approving and paying are the admin's; paying before approving fails.
        const row = (await service.from('closer_commissions').select('id').eq('lead_id', a.lead).single()).data as Row;
        const pay = { p_id: row.id, p_paid_at: null, p_note: 'transferencia' };
        expect((await jose.rpc('admin_commission_mark_paid', pay)).error?.message).toMatch(/commission_not_approved/);
        expect((await jose.rpc('admin_commission_approve', { p_id: row.id })).error).toBeNull();
        expect((await jose.rpc('admin_commission_mark_paid', pay)).error).toBeNull();
      } finally {
        await jose.rpc('admin_staff_set', { p_user_id: carla.userId, p_disabled: false, p_commission_rate: 10, p_notes: null });
        for (const x of [a, b]) {
          await service.from('closer_commissions').delete().eq('lead_id', x.lead);
          await service.from('crm_interactions').delete().eq('contact_id', x.contact);
          await service.from('clients').delete().eq('contact_id', x.contact);
          await service.from('leads').delete().eq('id', x.lead);
          await service.from('crm_contacts').delete().eq('id', x.contact);
        }
      }
    });

    it('the invitation needs the rate: the argument is mandatory and within 0..100', async () => {
      const missing = await jose.rpc('admin_staff_invite', { p_email: 'no-rate@example.test', p_role: 'closer' });
      expect(missing.error).toBeTruthy();
      const high = await jose.rpc('admin_staff_invite', { p_email: 'no-rate@example.test', p_role: 'closer', p_commission_rate: 101 });
      expect(high.error?.message).toMatch(/invalid_commission_rate/);
    });

    it('admin_staff_list: rate, MFA and counters per person, jose only', async () => {
      const { data, error } = await jose.rpc('admin_staff_list');
      expect(error).toBeNull();
      const byId = new Map((data as Row[]).map((r) => [r.user_id, r]));
      expect(byId.get(carla.userId)).toMatchObject({ role: 'closer', email: 'carla@test', commission_rate: 10, disabled_at: null, contacts_count: expect.any(Number) });
      expect(byId.get(dani.userId)).toMatchObject({ role: 'closer', mfa_enrolled: expect.any(Boolean) });
      expect(byId.get(dani.userId)?.disabled_at).not.toBeNull();
      expect((await ana.rpc('admin_staff_list')).error?.code).toBe('42501');
    });
  });

  describe('client stories (D52)', () => {
    it('ana proposes a story and cannot change its status; only the admin or the owner closer decide', async () => {
      const row = { client_id: SEED.clients.ana, author_user_id: ana.userId, title: `Reservas ${hex()}`, as_a: 'dueña', i_want: 'reservar online', so_that: 'no perder llamadas', acceptance_criteria: ['Formulario', 'Correo'] };
      const { data } = await ana.from('client_user_stories').insert(row).select().single();
      const story = data as Row;
      const storyId = story.id as string;
      try {
        expect(story.status).toBe('proposed');
        expect((await ana.from('client_user_stories').update({ status: 'accepted' }).eq('id', storyId)).error?.code).toBe('42501');
        expect((await ana.from('client_user_stories').update({ estimate_hours: 1 }).eq('id', storyId)).error?.code).toBe('42501');
        expect((await ana.from('client_user_stories').update({ title: 'Reservas online' }).eq('id', storyId).select('id')).data).toHaveLength(1);
        const decide = { p_story_id: storyId, p_estimate_hours: 6, p_estimate_amount: 600, p_note: 'ok' };
        expect((await ana.rpc('accept_user_story', decide)).error?.message).toMatch(/forbidden/);
        expect((await carla.rpc('accept_user_story', decide)).error?.message).toMatch(/forbidden/);
        const accepted = await jose.rpc('accept_user_story', decide);
        expect(accepted.error).toBeNull();
        expect(accepted.data).toEqual(expect.any(String));
        expect((await ana.from('client_tasks').select('id, story_id').eq('story_id', storyId)).data).toHaveLength(1);
        const edit = await ana.from('client_user_stories').update({ title: 'cambio' }).eq('id', storyId).select('id');
        expect(edit.data ?? []).toHaveLength(0);
      } finally {
        await service.from('client_tasks').delete().eq('story_id', storyId);
        await service.from('crm_interactions').delete().eq('contact_id', SEED.contacts.ana).in('kind', ['story_proposed', 'story_decided']).like('body', 'Reservas %');
        await service.from('client_user_stories').delete().eq('id', storyId);
      }
    });

    it("ana cannot propose for another client or as another author; carla reads none of Jose's clients' stories", async () => {
      const base = { title: 'X', as_a: 'a', i_want: 'b', so_that: 'c' };
      const forCarla = await ana.from('client_user_stories').insert({ ...base, client_id: SEED.clients.carla, author_user_id: ana.userId });
      expect(forCarla.error?.code).toBe('42501');
      const asBob = await ana.from('client_user_stories').insert({ ...base, client_id: SEED.clients.ana, author_user_id: bob.userId });
      expect(asBob.error?.code).toBe('42501');
      const accepted = await ana.from('client_user_stories').insert({ ...base, client_id: SEED.clients.ana, author_user_id: ana.userId, status: 'accepted' });
      expect(accepted.error?.code).toBe('42501');
      expect((await carla.from('client_user_stories').select('id').eq('id', SEED.stories.ana)).data ?? []).toHaveLength(0);
      expect((await carla.rpc('reject_user_story', { p_story_id: SEED.stories.ana, p_note: 'no' })).error?.message).toMatch(/forbidden/);
    });

    it('accepting needs hours and rejecting a reason; Carla decides the stories of her own client, with a task', async () => {
      const row = { client_id: SEED.clients.carla, title: `Cita ${hex()}`, as_a: 'dueño', i_want: 'reservar', so_that: 'no perder citas', acceptance_criteria: ['Formulario'] };
      const { data } = await service.from('client_user_stories').insert(row).select('id').single();
      const storyId = (data as Row).id as string;
      try {
        const accept = (hours: number | null, note: string | null = null) =>
          carla.rpc('accept_user_story', { p_story_id: storyId, p_estimate_hours: hours as number, p_estimate_amount: null as unknown as number, p_note: note as string });
        expect((await accept(0)).error?.message).toMatch(/estimate_required/);
        expect((await accept(null)).error?.message).toMatch(/estimate_required/);
        expect((await accept(2, 'x'.repeat(1001))).error?.message).toMatch(/note_too_long/);
        for (const reason of ['   ', null, 'x'.repeat(1001)]) {
          const rejected = await carla.rpc('reject_user_story', { p_story_id: storyId, p_note: reason as string });
          expect(rejected.error?.message, String(reason?.length)).toMatch(/reason_required|note_too_long/);
        }
        const stored = await service.from('client_user_stories').select('status').eq('id', storyId).single();
        expect((stored.data as Row).status).toBe('proposed');

        const done = await accept(6, 'Encaja');
        expect(done.error).toBeNull();
        expect(done.data).toEqual(expect.any(String));
        expect((await carla.from('client_tasks').select('id').eq('story_id', storyId)).data).toHaveLength(1);
        expect((await carla.rpc('convert_user_story', { p_story_id: storyId })).error?.message).toMatch(/story_not_accepted/);
      } finally {
        await service.from('client_tasks').delete().eq('story_id', storyId);
        await service.from('crm_interactions').delete().eq('contact_id', SEED.contacts.carlaClient).in('kind', ['story_proposed', 'story_decided']).like('body', 'Cita %');
        await service.from('client_user_stories').delete().eq('id', storyId);
      }
    });

    it('the material is the client\'s: the owner closer reads no asset row of her own client, the admin does', async () => {
      const id = randomUUID();
      const inserted = await service
        .from('client_assets')
        .insert({ id, client_id: SEED.clients.carla, source: 'admin', storage_path: `clients/${SEED.clients.carla}/${id}`, file_name: 'brief.pdf' });
      expect(inserted.error).toBeNull();
      try {
        expect((await carla.from('client_assets').select('id').eq('id', id)).data ?? []).toHaveLength(0);
        expect((await jose.from('client_assets').select('id').eq('id', id)).data).toHaveLength(1);
      } finally {
        await service.from('client_assets').delete().eq('id', id);
      }
    });

    it("area_client() returns the caller's own client row", async () => {
      const mine = await ana.rpc('area_client');
      expect(mine.error).toBeNull();
      expect(mine.data).toEqual([expect.objectContaining({ id: SEED.clients.ana, pack_code: 'P2' })]);
      expect((await bob.rpc('area_client')).data).toEqual([]);
      expect((await carla.rpc('area_client')).data).toEqual([]);
      expect((await anon.rpc('area_client')).error).toBeTruthy();
    });
  });

  describe('assets and comments (security review)', () => {
    it('client_assets refuses a MIME type outside the bucket allowlist and a size over 25 MiB', async () => {
      const row = (extra: Row) => {
        const id = randomUUID();
        return { id, client_id: SEED.clients.ana, uploaded_by_user_id: ana.userId, source: 'client', storage_path: `clients/${SEED.clients.ana}/${id}`, file_name: 'f', ...extra };
      };
      expect((await ana.from('client_assets').insert(row({ mime_type: 'application/x-msdownload', size_bytes: 10 }))).error?.code).toBe('23514');
      expect((await ana.from('client_assets').insert(row({ mime_type: 'application/zip', size_bytes: 26_214_401 }))).error?.code).toBe('23514');
      const ok = row({ mime_type: 'application/pdf', size_bytes: 1000 });
      expect((await ana.from('client_assets').insert(ok)).error).toBeNull();
      await service.from('client_assets').delete().eq('id', ok.id);
    });
  });

  describe('site content (D53)', () => {
    it('content_publish rejects {{DATO}} and foreign namespaces; only jose edits', async () => {
      const foreign = `auth.test.${hex()}`;
      const placeholder = `home.t${hex()}`;
      const draft = (key: string, value: unknown) => jose.rpc('content_save_draft', { p_kind: 'message_override', p_key: key, p_locale: 'es', p_draft: value });
      expect((await draft(foreign, { value: 'x' })).error).toBeNull();
      try {
        expect((await jose.rpc('content_publish')).error?.message).toMatch(/namespace_not_editable/);
        expect((await draft(foreign, null)).error).toBeNull();
        expect((await draft(placeholder, { value: 'Hola {{DATO: x}}' })).error).toBeNull();
        expect((await jose.rpc('content_publish')).error?.message).toMatch(/placeholder_in_content/);
        const settings = await jose.rpc('content_save_draft', { p_kind: 'settings', p_key: 'settings', p_locale: 'es', p_draft: {} });
        expect(settings.error?.message).toMatch(/invalid_locale_for_kind/);
      } finally {
        await service.from('site_content_entries').delete().in('key', [foreign, placeholder]);
      }
      for (const c of [carla, ana, dani]) {
        expect((await c.rpc('content_save_draft', { p_kind: 'message_override', p_key: 'home.x', p_locale: 'es', p_draft: { value: 'x' } })).error?.code).toBe('42501');
        expect(await visible(c, 'site_content_entries'), 'site_content_entries').toBe(0);
      }
      expect(await visible(jose, 'site_content_entries')).toBeGreaterThanOrEqual(2);
      expect(await visible(jose, 'site_content_versions')).toBeGreaterThanOrEqual(2);
    });
  });

  describe('price catalogue and quotes (Q23, D54)', () => {
    it('only the RPCs write the catalogue; a new pack is hidden, repriced with history, and soft deleted', async () => {
      const code = `T${hex()}`;
      expect((await jose.from('packs').update({ price: 1 }).eq('code', 'P1')).error?.code).toBe('42501');
      expect((await carla.from('packs').update({ price: 1 }).eq('code', 'P1')).error?.code).toBe('42501');
      expect((await carla.rpc('admin_pricing_set_pack', { p: { code, price: 1 } })).error?.code).toBe('42501');
      try {
        const create = { code, kind: 'web', slug: code.toLowerCase(), name: { es: 'Prueba', en: 'Test' }, price: 1000, weeks: 1, visible: false };
        expect((await jose.rpc('admin_pricing_set_pack', { p: create })).error).toBeNull();
        expect((await jose.rpc('admin_pricing_set_pack', { p: { code, price: 1200 } })).error).toBeNull();
        const history = await jose.from('pricing_price_history').select('old_price, new_price, changed_by').eq('item_code', code).order('id', { ascending: false }).limit(1);
        expect(history.data).toEqual([{ old_price: 1000, new_price: 1200, changed_by: jose.userId }]);
        expect(JSON.stringify((await jose.rpc('pricing_catalog_snapshot')).data)).not.toContain(code);
        expect((await jose.rpc('admin_pricing_set_pack', { p: { code, visible: true } })).error).toBeNull();
        const shown = (await jose.rpc('pricing_catalog_snapshot')).data as { packs: Row[] };
        expect(shown.packs.find((p) => p.code === code)).toMatchObject({ price: 1200 });
        expect((await jose.rpc('admin_pricing_delete', { p_kind: 'pack', p_code: code })).error).toBeNull();
        expect(JSON.stringify((await jose.rpc('pricing_catalog_snapshot')).data)).not.toContain(code);
        expect((await jose.rpc('admin_pricing_set_pack', { p: { code, price: 5 } })).error?.message).toMatch(/pack_deleted/);
        // A deleted pack is for staff (and for the client that bought it), not for any account.
        expect((await ana.from('packs').select('code').eq('code', code)).data).toEqual([]);
        expect((await carla.from('packs').select('code').eq('code', code)).data).toEqual([{ code }]);
        expect((await carla.rpc('pricing_catalog_snapshot')).error).toBeNull();
        expect((await ana.rpc('pricing_catalog_snapshot')).error?.code).toBe('42501');
        expect((await anon.rpc('pricing_published')).error).toBeTruthy();
        expect((await carla.rpc('pricing_published')).error?.code).toBe('42501');
        expect((await service.rpc('pricing_published')).error).toBeNull();
      } finally {
        await service.from('pricing_price_history').delete().eq('item_code', code);
        await service.from('packs').delete().eq('code', code);
      }
    });

    it('the seed catalogue has a hidden pack that never reaches the snapshot', async () => {
      const snap = (await jose.rpc('pricing_catalog_snapshot')).data as { packs: Row[]; apps: Row[]; extras: Row[] };
      expect(JSON.stringify(snap)).not.toContain('HIDDEN_PACK');
      expect(snap.packs.map((p) => p.code)).toEqual(expect.arrayContaining(['P1', 'P2', 'P3', 'P4']));
      expect(snap.apps.map((p) => p.code)).toEqual(expect.arrayContaining(['APP_MVP', 'APP_PLUS']));
      expect(snap.extras).toHaveLength(6);
    });

    it("carla builds a quote of extras: totals sum, the discount is the admin's, the price of a line is a snapshot", async () => {
      const created = await carla.rpc('quote_create', { p_contact_id: SEED.contacts.carlaClient, p_title: `Presupuesto ${hex()}`, p_lead_id: SEED.leads.carlaWon });
      expect(created.error).toBeNull();
      const quote = created.data as string;
      try {
        expect((await carla.rpc('quote_add_item', { p_quote_id: quote, p_extra_code: 'seo_full', p_quantity: 1 })).error).toBeNull();
        expect((await carla.rpc('quote_add_item', { p_quote_id: quote, p_extra_code: 'maintenance_basic', p_quantity: 12 })).error).toBeNull();
        const total = await carla.from('custom_quotes').select('subtotal, total, status').eq('id', quote).single();
        expect(total.data).toEqual({ subtotal: 1188, total: 1188, status: 'draft' });
        expect((await carla.from('custom_quotes').update({ discount_amount: 100 }).eq('id', quote)).error?.code).toBe('42501');
        expect((await carla.rpc('admin_quote_set_discount', { p_quote_id: quote, p_amount: 100, p_note: 'x' })).error?.message).toMatch(/forbidden/);
        expect((await carla.from('custom_quote_items').insert({ quote_id: quote, extra_code: 'no_existe', quantity: 1 })).error?.code).toBe('23503');
        expect((await jose.rpc('admin_quote_set_discount', { p_quote_id: quote, p_amount: 100, p_note: 'amigo' })).error).toBeNull();
        expect((await carla.from('custom_quotes').select('total').eq('id', quote).single()).data).toEqual({ total: 1088 });
        expect((await carla.rpc('quote_mark_sent', { p_quote_id: quote })).error).toBeNull();
        expect((await carla.rpc('quote_add_item', { p_quote_id: quote, p_extra_code: 'geo', p_quantity: 1 })).error?.message).toMatch(/quote_not_draft/);
        // Jose's contact: carla cannot create a quote there; nobody else sees this one.
        expect((await carla.rpc('quote_create', { p_contact_id: SEED.contacts.marta, p_title: 'X' })).error?.message).toMatch(/forbidden/);
        for (const c of [ana, bob, dani, anon]) expect((await c.from('custom_quotes').select('id').eq('id', quote)).data ?? []).toHaveLength(0);
      } finally {
        await service.from('crm_interactions').delete().eq('contact_id', SEED.contacts.carlaClient).eq('kind', 'message_sent');
        await service.from('custom_quotes').delete().eq('id', quote);
      }
    });
  });

  describe('security review of 1.8e (the exploits found, now refused)', () => {
    it('a closer cannot forge leads, interaction actors, Telegram codes or the quote status', async () => {
      const contact = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Sec ${hex()}`, source: 'manual', owner_id: carla.userId });
      let quote: string | undefined;
      try {
        const forged = await carla.from('leads')
          .insert({ contact_id: contact, source: 'manual', status: 'won', amount: 99999, idempotency_key: `forged-${hex()}` })
          .select('status, amount, idempotency_key').single();
        expect(forged.data).toEqual({ status: 'open', amount: null, idempotency_key: null });
        const note = await carla.from('crm_interactions')
          .insert({ contact_id: contact, kind: 'note', direction: 'internal', actor: 'jose', body: 'x' }).select('actor').single();
        expect(note.data).toEqual({ actor: 'closer' });
        expect((await carla.from('crm_interactions').insert({ contact_id: contact, kind: 'lead_won', direction: 'internal', actor: 'jose' })).error?.code).toBe('42501');
        expect((await carla.from('crm_contacts').insert({ kind: 'lead', status: 'won', display_name: `Won ${hex()}`, source: 'manual', owner_id: carla.userId })).error?.code).toBe('42501');
        expect((await carla.from('staff_telegram_codes').insert({ user_id: carla.userId, code: 'AAAAAAAA', expires_at: '2099-01-01' })).error?.code).toBe('42501');
        const created = await carla.rpc('quote_create', { p_contact_id: contact, p_title: `Sec ${hex()}`, p_lead_id: null });
        expect(created.error).toBeNull();
        quote = created.data as string;
        expect((await carla.from('custom_quotes').update({ status: 'accepted' }).eq('id', quote)).error?.code).toBe('42501');
      } finally {
        if (quote) await service.from('custom_quotes').delete().eq('id', quote);
        await service.from('crm_interactions').delete().eq('contact_id', contact);
        await service.from('leads').delete().eq('contact_id', contact);
        await service.from('crm_contacts').delete().eq('id', contact);
      }
    });

    it('an inbound lead never lands in the contact a closer owns with the same email', async () => {
      const email = `victima-${hex()}@example.test`;
      const mine = await mustInsert('crm_contacts', { kind: 'lead', status: 'new', display_name: `Squat ${hex()}`, email, source: 'manual', owner_id: carla.userId });
      let lead: string | undefined;
      let contact: string | undefined;
      try {
        const res = await service.rpc('create_lead', { p: { source: 'web_form', email, message: 'secreto' } });
        expect(res.error).toBeNull();
        const row = (res.data as Row[])[0] as Row;
        lead = row.lead_id as string;
        contact = row.contact_id as string;
        expect(contact).not.toBe(mine);
        expect((await carla.from('leads').select('id').eq('id', lead)).data ?? []).toHaveLength(0);
      } finally {
        if (lead) {
          await service.from('crm_interactions').delete().eq('lead_id', lead);
          await service.from('leads').delete().eq('id', lead);
        }
        if (contact) await service.from('crm_contacts').delete().eq('id', contact);
        await service.from('crm_contacts').delete().eq('id', mine);
      }
    });
  });

  describe('telegram link codes and notification rules', () => {
    it('carla asks for a code (8 characters) and the service role links it once; dani cannot ask', async () => {
      const begin = await carla.rpc('staff_telegram_begin');
      expect(begin.error).toBeNull();
      const code = begin.data as string;
      try {
        expect(code).toHaveLength(8);
        expect((await carla.from('staff_telegram_codes').select('code')).data).toEqual([{ code }]);
        expect((await carla.rpc('staff_telegram_link', { p_code: code, p_chat_id: '123' })).error?.code).toBe('42501');
        expect((await service.rpc('staff_telegram_link', { p_code: code.toLowerCase(), p_chat_id: '4242' })).data).toBe(true);
        expect((await service.rpc('staff_telegram_link', { p_code: code, p_chat_id: '4242' })).data).toBe(false);
        expect((await dani.rpc('staff_telegram_begin')).error?.code).toBe('42501');
      } finally {
        await service.from('staff_members').update({ telegram_chat_id: null }).eq('user_id', carla.userId!);
        await service.from('staff_telegram_codes').delete().eq('user_id', carla.userId!);
      }
    });

    it('notification_recipients is service-only and returns the channel of a client rule', async () => {
      expect((await carla.rpc('notification_recipients', { p_event: 'lead.created', p_owner_id: carla.userId })).error?.code).toBe('42501');
      const { data, error } = await service.rpc('notification_recipients', { p_event: 'client.invited', p_owner_id: null });
      expect(error).toBeNull();
      expect(data).toEqual([{ channel: 'email', address: null }]);
    });
  });
});
