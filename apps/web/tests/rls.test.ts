// @vitest-environment node
// RLS with four accounts against Supabase local (DT §6.3, §8.4; plan 1.8 incl. the v2.1 additions).
// Needs `supabase start` + `supabase db reset` (migrations + seed). Skipped with a warning when the stack does
// not answer locally, and a failure in CI (same criterion as packages/types/test/database-drift.test.ts).
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

  describe('blog_comments', () => {
    it('anon reads only approved', async () => {
      const { data, error } = await anon.from('blog_comments').select('status');
      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect((data as Row[]).every((c) => c.status === 'approved')).toBe(true);
    });

    it('ana sees her pending, not bob pending', async () => {
      const { data } = await ana.from('blog_comments').select('user_id,status');
      const pending = ((data ?? []) as Row[]).filter((c) => c.status === 'pending');
      expect(pending.length).toBeGreaterThan(0);
      expect(pending.every((c) => c.user_id === ana.userId)).toBe(true);
    });

    it('ana cannot insert approved, and inserts pending', async () => {
      const base = { slug: 'x', locale: 'es', body: 'hi', author_name: 'Ana', user_id: ana.userId };
      const rejected = await ana.from('blog_comments').insert({ ...base, status: 'approved' });
      expect(rejected.error).toBeTruthy();
      const accepted = await ana.from('blog_comments').insert({ ...base, status: 'pending' });
      expect(accepted.error).toBeNull();
    });

    it('a normal user cannot moderate; admin reads and updates all', async () => {
      const own = await ana.from('blog_comments').update({ status: 'approved' }).eq('id', '00000000-0000-4000-8000-000000000d02').select();
      expect(own.data).toHaveLength(0);
      const all = await jose.from('blog_comments').select('id');
      expect((all.data ?? []).length).toBeGreaterThanOrEqual(3);
      const moderated = await jose
        .from('blog_comments')
        .update({ moderated_by: jose.userId })
        .eq('id', '00000000-0000-4000-8000-000000000d03')
        .select();
      expect(moderated.data).toHaveLength(1);
    });
  });

  describe('affiliates', () => {
    it('ana cannot change her level', async () => {
      const { data } = await ana.from('affiliates').update({ level: 'premium' }).eq('user_id', ana.userId).select();
      expect(data).toHaveLength(0);
    });

    it('ana reads only her own affiliate row; admin reads both', async () => {
      const mine = await ana.from('affiliates').select('user_id,code');
      expect((mine.data as Row[]).map((a) => a.user_id)).toEqual([ana.userId]);
      expect((mine.data as Row[])[0]?.code).toBe('ANA-TEST01');
      const all = await jose.from('affiliates').select('code');
      expect((all.data ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it('ana reads affiliate_leads_view without contact data', async () => {
      const { data } = await ana.from('affiliate_leads_view').select('*');
      expect((data ?? []).length).toBeGreaterThan(0);
      expect(Object.keys((data as Row[])[0] ?? {})).not.toContain('contact_email');
    });

    it('ana reads 0 rows of leads directly', async () => {
      const { data } = await ana.from('leads').select('id');
      expect(data).toHaveLength(0);
    });

    it('ana cannot insert affiliate_rewards, nor read bob rewards', async () => {
      const { error } = await ana.from('affiliate_rewards').insert({
        affiliate_id: ana.affiliateId,
        lead_id: ana.leadId,
        type: 'percent',
        amount: 1,
        base_amount: 10,
        pricing_version: 'x',
      });
      expect(error).toBeTruthy();
      const own = await ana.from('affiliate_rewards').select('id');
      expect(own.data).toHaveLength(0);
      const bobs = await bob.from('affiliate_rewards').select('affiliate_id');
      expect((bobs.data as Row[]).every((r) => r.affiliate_id === bob.affiliateId)).toBe(true);
      expect(bobs.data).toHaveLength(1);
    });

    it('admin reads rewards', async () => {
      const { data } = await jose.from('affiliate_rewards').select('status');
      expect((data ?? []).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('upgrade_requests (v2.1: only through request_upgrade)', () => {
    it('ana cannot insert directly, even for her own client', async () => {
      const { error } = await ana.from('upgrade_requests').insert({
        client_id: ana.clientId,
        from_pack_code: 'P2',
        to_pack_code: 'P3',
        computed_price: 1,
        pricing_version: '2026-09-14',
      });
      expect(error).toBeTruthy();
    });

    it('bob (no client) cannot request an upgrade', async () => {
      const { error } = await bob.rpc('request_upgrade', { p_to_pack_code: 'P3', p_extras: [] });
      expect(error?.message).toMatch(/not_a_client/);
    });

    it('ana requests P2 -> P3 and the database computes 1100', async () => {
      const { data, error } = await ana.rpc('request_upgrade', { p_to_pack_code: 'P3', p_extras: [] });
      expect(error).toBeNull();
      const row = await ana.from('upgrade_requests').select('*').eq('id', data).single();
      expect(row.data).toMatchObject({
        client_id: ana.clientId,
        from_pack_code: 'P2',
        to_pack_code: 'P3',
        status: 'pending',
        pricing_version: '2026-09-14',
      });
      expect(Number(row.data?.computed_price)).toBe(1100);
    });

    it('ana can request only an extra, priced at list (250), and cannot downgrade', async () => {
      const extra = await ana.rpc('request_upgrade', { p_to_pack_code: null, p_extras: ['seo_basic'] });
      expect(extra.error).toBeNull();
      const row = await ana.from('upgrade_requests').select('computed_price').eq('id', extra.data).single();
      expect(Number(row.data?.computed_price)).toBe(250);
      const down = await ana.rpc('request_upgrade', { p_to_pack_code: 'P1', p_extras: [] });
      expect(down.error?.message).toMatch(/not_an_upgrade/);
    });

    it('bob sees none of ana requests; admin sees them', async () => {
      const bobs = await bob.from('upgrade_requests').select('id');
      expect(bobs.data).toHaveLength(0);
      const admin = await jose.from('upgrade_requests').select('id');
      expect((admin.data ?? []).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('leads', () => {
    it('anon reads nothing', async () => {
      const { data } = await anon.from('leads').select('id');
      expect(data ?? []).toHaveLength(0);
    });

    it('jose inserts a manual lead', async () => {
      const { error } = await jose.from('leads').insert({ estado: 'nuevo', fuente: 'whatsapp', contact_name: 'Marta' });
      expect(error).toBeNull();
    });

    it('ana cannot insert a lead', async () => {
      const { error } = await ana.from('leads').insert({ estado: 'nuevo', fuente: 'whatsapp' });
      expect(error).toBeTruthy();
    });

    it('admin_close_lead_paid rejects non-admin', async () => {
      const { error } = await ana.rpc('admin_close_lead_paid', {
        p_lead_id: ana.leadId,
        p_base_amount: 1400,
        p_reward_type: 'percent',
        p_reward_amount: 140,
        p_reward_percent: 10,
        p_pricing_version: '2026-09-14',
        p_generate_reward: true,
      });
      expect(error?.message).toMatch(/forbidden/);
    });

    it('idempotency_key is unique', async () => {
      const key = `test:${randomUUID()}`;
      const first = await service.from('leads').insert({ estado: 'nuevo', fuente: 'web_form', idempotency_key: key });
      expect(first.error).toBeNull();
      const again = await service.from('leads').insert({ estado: 'nuevo', fuente: 'web_form', idempotency_key: key });
      expect(again.error?.code).toBe('23505');
    });
  });

  describe('clients.invite_email / claim_client_access (v2.1: confirmed email, skip locked)', () => {
    it('sin@test (unconfirmed) cannot claim the client invited with its email', async () => {
      const { data, error } = await sin.rpc('claim_client_access');
      expect(error).toBeNull();
      expect(data).toBeNull();
      const { data: row } = await service.from('clients').select('user_id').eq('id', SEED.clients.invitedSin).single();
      expect(row?.user_id).toBeNull();
    });

    it('a confirmed user without an invite gets null', async () => {
      const { data, error } = await bob.rpc('claim_client_access');
      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it('a confirmed user claims the client invited with their email', async () => {
      const email = `claim-${randomUUID()}@test`;
      const created = await service.auth.admin.createUser({ email, password: TEST_PASSWORD, email_confirm: true });
      expect(created.error).toBeNull();
      const userId = created.data.user?.id as string;
      const lead = await service
        .from('leads')
        .insert({ estado: 'cerrado', fuente: 'web_form', monto: 900 })
        .select('id')
        .single();
      expect(lead.error).toBeNull();
      const client = await service
        .from('clients')
        .insert({ lead_id: lead.data?.id, invite_email: email.toUpperCase() })
        .select('id')
        .single();
      expect(client.error).toBeNull();

      const session = await clientFor('anon');
      await session.auth.signInWithPassword({ email, password: TEST_PASSWORD });
      const { data, error } = await session.rpc('claim_client_access');
      expect(error).toBeNull();
      expect(data).toBe(client.data?.id);
      const claimed = await service.from('clients').select('user_id').eq('id', client.data?.id).single();
      expect(claimed.data?.user_id).toBe(userId);
    });

    it('anon cannot call the RPC', async () => {
      const { error } = await anon.rpc('claim_client_access');
      expect(error).toBeTruthy();
    });
  });

  describe('user_profiles (v2.0)', () => {
    it("ana reads her profile and not bob's", async () => {
      const { data } = await ana.from('user_profiles').select('user_id');
      expect((data ?? []).length).toBe(1);
      expect((data as Row[]).every((r) => r.user_id === ana.userId)).toBe(true);
    });

    it('first_audience is write-once', async () => {
      await bob.from('user_profiles').upsert({ user_id: bob.userId, first_audience: 'referral', first_audience_source: 'ref' });
      const { error } = await bob.from('user_profiles').update({ first_audience: 'business' }).eq('user_id', bob.userId);
      expect(error?.message).toMatch(/write-once/);
    });

    it('admin reads every profile; anon none', async () => {
      const admin = await jose.from('user_profiles').select('user_id');
      expect((admin.data ?? []).length).toBeGreaterThanOrEqual(2);
      const visitor = await anon.from('user_profiles').select('user_id');
      expect(visitor.data ?? []).toHaveLength(0);
    });
  });

  describe('area_lead_summary (v2.1: confirmed email, proposal leads only)', () => {
    it('returns only the caller lead', async () => {
      const a = await ana.rpc('area_lead_summary');
      expect(a.error).toBeNull();
      expect(a.data).toHaveLength(1);
      expect((a.data as Row[])[0]).toMatchObject({ pack_code: 'P2', is_app: false });
      expect(Number((a.data as Row[])[0]?.price_from)).toBe(1400);
      const b = await bob.rpc('area_lead_summary');
      expect(b.data).toEqual([]);
    });

    it('sin@test (unconfirmed) gets nothing although a proposal lead has its email', async () => {
      const { data, error } = await sin.rpc('area_lead_summary');
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('anon cannot call it', async () => {
      const { error } = await anon.rpc('area_lead_summary');
      expect(error).toBeTruthy();
    });
  });

  describe('increment_quota (v2.1: service role only)', () => {
    it('counts atomically against the limit with the service role', async () => {
      const key = `test:${randomUUID()}`;
      const call = () => service.rpc('increment_quota', { p_key: key, p_limit: 2, p_ttl: '1 hour' });
      expect((await call()).data).toBe(true);
      expect((await call()).data).toBe(true);
      expect((await call()).data).toBe(false);
    });

    it('a window that expired starts again', async () => {
      const key = `test:${randomUUID()}`;
      await service.rpc('increment_quota', { p_key: key, p_limit: 1, p_ttl: '-1 second' });
      const { data } = await service.rpc('increment_quota', { p_key: key, p_limit: 1, p_ttl: '1 hour' });
      expect(data).toBe(true);
    });

    it('authenticated and anon cannot call it', async () => {
      const args = { p_key: 'test:x', p_limit: 1, p_ttl: '1 hour' };
      expect((await ana.rpc('increment_quota', args)).error).toBeTruthy();
      expect((await anon.rpc('increment_quota', args)).error).toBeTruthy();
    });
  });

  describe('scheduled_jobs (service role only)', () => {
    it('seeds the jobs of DT §0b and lists the due ones for the service role', async () => {
      const { data, error } = await service.rpc('scheduled_jobs_due', { p_now: new Date().toISOString() });
      expect(error).toBeNull();
      const names = (data as Row[]).map((j) => j.name);
      expect(names).toEqual(expect.arrayContaining(['radar.sweep', 'radar.daily', 'leads.notify_retry']));
      expect((data as Row[]).find((j) => j.name === 'radar.daily')).toMatchObject({ cron: '0 8 * * *', tz: 'Europe/Madrid' });
    });

    it('authenticated cannot read or change them', async () => {
      expect((await ana.rpc('scheduled_jobs_due', { p_now: new Date().toISOString() })).error).toBeTruthy();
      expect((await ana.rpc('scheduled_jobs_disable', { p_name: 'radar.sweep', p_reason: 'x' })).error).toBeTruthy();
    });
  });

  describe('admin_counters', () => {
    it('is refused to ana', async () => {
      const { error } = await ana.rpc('admin_counters');
      expect(error?.message).toMatch(/forbidden/);
    });

    it('returns the counters to the admin', async () => {
      const { data, error } = await jose.rpc('admin_counters');
      expect(error).toBeNull();
      const row = (data as Row[])[0] as Row;
      expect(Object.keys(row).sort()).toEqual(['comments_pending', 'leads_new', 'rewards_pending', 'upgrades_pending']);
      expect(Number(row.rewards_pending)).toBeGreaterThanOrEqual(1);
    });
  });
});
