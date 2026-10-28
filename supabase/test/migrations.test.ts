import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const read = (name: string) => readFileSync(new URL(name, dir), 'utf8');

describe('task 1.8 migrations', () => {
  it('has the plan files, in order, plus the three v2.1 ones', () => {
    expect(files).toEqual([
      '20260917100000_leads_web_fields.sql',
      '20260917100100_pack_codes.sql',
      '20260917100200_blog_comments.sql',
      '20260917100300_affiliates.sql',
      '20260917100400_affiliate_rewards.sql',
      '20260917100500_upgrade_requests.sql',
      '20260917100600_client_access_claim.sql',
      '20260917100650_admin_close_lead_paid.sql',
      '20260917100700_notify_lead_event.sql',
      '20260929100000_user_profiles.sql',
      '20260930100000_quota_counters.sql',
      '20260930100100_scheduled_jobs.sql',
      '20260930100200_admin_counters.sql',
    ]);
  });

  it('is additive: nothing drops, truncates or deletes', () => {
    for (const f of files) {
      const sql = read(f).replace(/--.*$/gm, '');
      expect(sql, f).not.toMatch(/\b(drop\s+(table|column|schema|policy|function|trigger)|truncate|delete\s+from)\b/i);
    }
  });

  it('copies the affiliate code regex of packages/pricing literally', () => {
    const ts = readFileSync(new URL('../../packages/pricing/src/affiliate-code.ts', import.meta.url), 'utf8');
    const source = /AFFILIATE_CODE_RE = \/(.+)\/;/.exec(ts)?.[1];
    expect(source).toBe('^[A-Z0-9]{3,12}-[A-Z0-9]{6}$');
    expect(read('20260917100300_affiliates.sql')).toContain(`check (code ~ '${source}')`);
  });

  it('the affiliate trigger only generates a code when none is given and qualifies gen_random_bytes', () => {
    const sql = read('20260917100300_affiliates.sql');
    expect(sql).toMatch(/if new\.code is not null then\s+return new;/);
    expect(sql).toContain('extensions.gen_random_bytes');
    expect(sql).toContain('set search_path = public, extensions');
  });

  it('the RPCs of unconfirmed-sensitive flows check the confirmed email and are closed to anon', () => {
    for (const f of ['20260917100600_client_access_claim.sql', '20260929100000_user_profiles.sql']) {
      const sql = read(f);
      expect(sql, f).toContain('email_confirmed_at');
      expect(sql, f).toMatch(/revoke (all|execute) on function public\.(claim_client_access|area_lead_summary)\(\) from public, anon/);
    }
    expect(read('20260917100600_client_access_claim.sql')).toContain('for update skip locked');
    expect(read('20260929100000_user_profiles.sql')).toContain("l.fuente = 'web_proposal'");
  });

  it('upgrade_requests has no direct insert path', () => {
    const sql = read('20260917100500_upgrade_requests.sql');
    expect(sql).not.toMatch(/for insert/);
    expect(sql).toMatch(/grant select, update on public\.upgrade_requests/);
    expect(sql).toContain('create or replace function public.request_upgrade');
  });

  it('quota and scheduler functions are service role only', () => {
    expect(read('20260930100000_quota_counters.sql')).toContain(
      'grant execute on function public.increment_quota(text, integer, interval) to service_role',
    );
    const jobs = read('20260930100100_scheduled_jobs.sql');
    expect(jobs.match(/to service_role;/g)).toHaveLength(3);
  });

  it('seeds the scheduled jobs of DT §0b with radar reduced to three', () => {
    const sql = read('20260930100100_scheduled_jobs.sql');
    for (const name of [
      'radar.sweep', 'radar.mail', 'radar.daily', 'newsletter.monday', 'newsletter.thursday', 'newsletter.sunday',
      'newsletter.feeds', 'newsletter.sweep', 'newsletter.stats', 'leads.notify_retry', 'brevo.stats',
    ]) {
      expect(sql, name).toContain(`('${name}'`);
    }
    expect(sql.match(/\('radar\./g)).toHaveLength(3);
  });
});

describe('seed', () => {
  const seed = readFileSync(new URL('../seed/seed.sql', import.meta.url), 'utf8');

  it('has resolved the 1.8 TODOs and keeps the dump one', () => {
    expect(seed).not.toContain('TODO(1.8)');
    expect(seed).toContain('TODO(1.6 dump)');
  });

  it('fixes the affiliate codes and the unconfirmed account', () => {
    expect(seed).toContain("'ANA-TEST01', 'standard'");
    expect(seed).toContain("'BOB-TEST01', 'premium'");
    expect(seed).toMatch(/'sin@test'[^;]*?, null,\n/);
  });
});
