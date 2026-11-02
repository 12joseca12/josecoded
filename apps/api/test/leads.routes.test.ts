// POST /api/v1/leads and GET /api/v1/affiliates/validate through the real app with fakes (env.__deps).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeClock } from './fakes/clock.fake';
import { createFakeAffiliates, createFakeLeads, createFakeNotices, createFakeTelegram, createFakeTurnstile } from './fakes/ports.fake';
import { createFakePricing } from './fakes/pricing.fake';
import { createFakeSupabaseGateway } from './fakes/supabase.fake';
import { baseEnv, call, json } from './helpers';
import { signProposalToken } from '../src/services/proposal-token';

const KEY = '3f6c0a52-5a6e-4c1e-9d56-6c7f5a1b2c3d';
const CODE = 'ANA-TEST01';
const MARTA_ID = '7b1c0a52-5a6e-4c1e-9d56-6c7f5a1b2c3d';
const lead = (extra: Record<string, unknown> = {}) => ({
  source: 'web_form',
  locale: 'es',
  idempotencyKey: KEY,
  contact: { name: 'Marta', email: 'marta@example.com' },
  message: 'hola',
  turnstileToken: 't',
  ...extra,
});

function setup(over: { verdict?: 'ok' | 'failed' | 'unavailable'; codes?: string[] } = {}) {
  const turnstile = createFakeTurnstile(over.verdict ?? 'ok');
  const leads = createFakeLeads(over.codes ?? [CODE]);
  const telegram = createFakeTelegram();
  const notices = createFakeNotices();
  const clock = createFakeClock('2026-11-01T10:00:00.000Z');
  const affiliates = createFakeAffiliates({ [CODE]: 'ana@example.com' });
  const supabase = createFakeSupabaseGateway({ 'jwt-marta': { id: MARTA_ID, email: 'marta@example.com', aal: 'aal1' } });
  const deps = { turnstile, leads, telegram, notices, clock, affiliates, supabase };
  const post = (b: unknown = lead(), extra: Parameters<typeof call>[2] = {}) =>
    call('POST', '/api/v1/leads', { body: b, deps, ...extra });
  return { turnstile, leads, telegram, notices, deps, post };
}

afterEach(() => vi.restoreAllMocks());

describe('POST /leads: creation and notification', () => {
  it('201 with leadId, create_lead payload built server-side, and Telegram told in the request', async () => {
    const { post, leads, telegram, turnstile } = setup();
    const res = await post();
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data.leadId).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.notified).toBe('telegram');
    expect(leads.payloads[0]).toMatchObject({
      email: 'marta@example.com',
      display_name: 'Marta',
      source: 'web_form',
      via: 'client',
      locale: 'es',
      idempotency_key: KEY,
      message: 'hola',
    });
    expect(turnstile.calls[0]!.actions).toEqual(['contact', 'proposal_send', 'partner']);
    expect(telegram.sent).toHaveLength(1);
    // the notice carries ids and the source, never the visitor's data
    expect(telegram.sent[0]).not.toMatch(/Marta|marta@|hola/);
  });

  it('the lead is saved and answered "outbox" when Telegram fails or is not configured', async () => {
    const failing = setup();
    failing.telegram.fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await json(await failing.post())).data.notified).toBe('outbox');
    const none = setup();
    const res = await none.post(lead(), { deps: { ...none.deps, telegram: undefined } });
    expect(res.status).toBe(201);
    expect((await json(res)).data.notified).toBe('outbox');
  });

  it('does not tell Jose twice when the outbox already marked the notice', async () => {
    const { post, notices, telegram } = setup();
    // the drain delivered it first
    const original = notices.wasSent;
    notices.wasSent = async () => true;
    const { data } = await json(await post());
    notices.wasSent = original;
    expect(data.notified).toBe('telegram');
    expect(telegram.sent).toHaveLength(0);
  });

  it('a repeated idempotency key -> 200 with the same leadId, one lead, one notice', async () => {
    const { post, leads, telegram } = setup();
    const first = await json(await post());
    const second = await post();
    expect(second.status).toBe(200);
    const body = await json(second);
    expect(body.data.leadId).toBe(first.data.leadId);
    expect(body.data.notified).toBe('none');
    expect(leads.payloads).toHaveLength(1);
    expect(telegram.sent).toHaveLength(1);
  });

  it('partner_form is a partner lead', async () => {
    const { post, leads } = setup();
    await post(lead({ source: 'partner_form' }));
    expect(leads.payloads[0]).toMatchObject({ via: 'partner', chat_case: 'partner' });
  });

  it('web_notify (notify me of new guides) is a plain client lead from an email only', async () => {
    const { post, leads } = setup();
    const res = await post(lead({ source: 'web_notify', message: undefined, contact: { name: 'marta@example.com', email: 'marta@example.com' } }));
    expect(res.status).toBe(201);
    expect(leads.payloads[0]).toMatchObject({ source: 'web_notify', via: 'client', email: 'marta@example.com' });
  });

  it('a phone is enough', async () => {
    const { post, leads } = setup();
    const res = await post(lead({ contact: { name: 'Marta', phone: '+34 600 111 222' } }));
    expect(res.status).toBe(201);
    expect(leads.payloads[0]).toMatchObject({ phone: '+34 600 111 222' });
  });
});

describe('POST /leads: authentication', () => {
  it('no Turnstile token and no server key -> 403', async () => {
    const { post, leads } = setup();
    const res = await post(lead({ turnstileToken: undefined }));
    expect(res.status).toBe(403);
    expect((await json(res)).error.code).toBe('bot_check_failed');
    expect(leads.payloads).toHaveLength(0);
  });

  it('failed Turnstile -> 403, unavailable -> 503, never a lead', async () => {
    const failed = setup({ verdict: 'failed' });
    expect((await failed.post()).status).toBe(403);
    const down = setup({ verdict: 'unavailable' });
    expect((await down.post()).status).toBe(503);
    expect(failed.leads.payloads.length + down.leads.payloads.length).toBe(0);
  });

  it('the server key admits a Cal.com booking without Turnstile', async () => {
    const { post, leads, turnstile } = setup();
    const res = await post(lead({ source: 'calcom', turnstileToken: undefined, idempotencyKey: 'calcom:abc123XYZ' }), {
      headers: { 'x-josecoded-server-key': baseEnv.SERVER_KEY },
    });
    expect(res.status).toBe(201);
    expect(leads.payloads[0]).toMatchObject({ source: 'calcom', idempotency_key: 'calcom:abc123XYZ' });
    expect(turnstile.calls).toHaveLength(0);
  });

  it('a wrong server key is 403 even with a valid Turnstile token (no fallback)', async () => {
    const { post, turnstile } = setup();
    for (const key of ['wrong', '', baseEnv.SERVER_KEY.slice(0, -1), `${baseEnv.SERVER_KEY}x`]) {
      const res = await post(lead(), { headers: { 'x-josecoded-server-key': key } });
      expect(res.status).toBe(403);
    }
    expect(turnstile.calls).toHaveLength(0);
  });

  it('a server key header with no SERVER_KEY configured is 403', async () => {
    const { post } = setup();
    const res = await post(lead(), { headers: { 'x-josecoded-server-key': 'anything' }, env: { SERVER_KEY: undefined } });
    expect(res.status).toBe(403);
  });

  it('calcom is not a browser source, and a browser cannot claim a calcom: idempotency key', async () => {
    const { post, leads } = setup();
    expect((await post(lead({ source: 'calcom' }))).status).toBe(403);
    expect((await post(lead({ idempotencyKey: 'calcom:abc123XYZ' }))).status).toBe(400);
    expect((await post(lead({ idempotencyKey: 'not-a-uuid-at-all' }))).status).toBe(400);
    expect(leads.payloads).toHaveLength(0);
  });

  it('sources reserved to the system are refused by the schema', async () => {
    const { post } = setup();
    for (const source of ['chat', 'manual', 'referral', 'admin']) {
      expect((await post(lead({ source }))).status).toBe(400);
    }
  });

  it('the native limiter caps browsers (429) but not the server key', async () => {
    const limited = { limit: async () => ({ success: false }) };
    const { post, turnstile } = setup();
    const browser = await post(lead(), { env: { LEADS_RATE_LIMITER: limited } });
    expect(browser.status).toBe(429);
    expect(turnstile.calls).toHaveLength(0);
    const server = await post(lead({ source: 'calcom', turnstileToken: undefined, idempotencyKey: 'calcom:abc123XYZ' }), {
      env: { LEADS_RATE_LIMITER: limited },
      headers: { 'x-josecoded-server-key': baseEnv.SERVER_KEY },
    });
    expect(server.status).toBe(201);
  });
});

describe('POST /leads: validation', () => {
  it.each([
    ['no email and no phone', lead({ contact: { name: 'X' } })],
    ['invalid email', lead({ contact: { name: 'X', email: 'nope' } })],
    ['empty name', lead({ contact: { name: '  ', email: 'a@b.co' } })],
    ['invalid phone', lead({ contact: { name: 'X', phone: 'call me maybe' } })],
    ['message too long', lead({ message: 'x'.repeat(2001) })],
    ['bad locale', lead({ locale: 'fr' })],
    ['path that is a URL', lead({ meta: { path: 'https://evil.example' } })],
    ['protocol-relative path', lead({ meta: { path: '//evil.example' } })],
  ])('400 for %s', async (_name, body) => {
    const { post, leads } = setup();
    expect((await post(body)).status).toBe(400);
    expect(leads.payloads).toHaveLength(0);
  });

  it('stores only path and utm of the client meta, and strips control characters from the text', async () => {
    const { post, leads } = setup();
    const res = await post(lead({ message: 'hola\u0000 mundo', meta: { path: '/servicios', utm: { utm_source: 'x' }, is_admin: true } }));
    expect(res.status).toBe(201);
    const stored = leads.payloads[0]!;
    expect(stored.meta).toEqual({ path: '/servicios', utm: { utm_source: 'x' } });
    expect(stored.message).toBe('hola mundo');
  });

  it('refuses utm keys that are not utm_*', async () => {
    const { post, leads } = setup();
    expect((await post(lead({ meta: { utm: { evil: 'y' } } }))).status).toBe(400);
    expect(leads.payloads).toHaveLength(0);
  });

  it('413 above 16 KiB and 415 for a form post', async () => {
    const { deps } = setup();
    const big = JSON.stringify(lead({ message: 'x'.repeat(1900), pad: 'y'.repeat(17000) }));
    expect((await call('POST', '/api/v1/leads', { raw: big, headers: { 'content-type': 'application/json' }, deps })).status).toBe(413);
    expect((await call('POST', '/api/v1/leads', { raw: 'a=b', headers: { 'content-type': 'text/plain' }, deps })).status).toBe(415);
  });
});

describe('POST /leads: proposals', () => {
  const payload = {
    v: 1 as const,
    id: '9a6c0a52-5a6e-4c1e-9d56-6c7f5a1b2c3d',
    pack: 'P2' as const,
    extras: ['seo_basic' as const],
    priceFrom: 1,
    isApp: false,
    pricingVersion: '2000-01-01',
    locale: 'es' as const,
    source: 'ai' as const,
    summary: 'Resumen',
    scope: ['a', 'b', 'c'],
    exp: Math.floor(Date.parse('2026-11-01T10:00:00.000Z') / 1000) + 3600,
  };

  it('web_proposal without a token is a 400', async () => {
    const { post } = setup();
    const res = await post(lead({ source: 'web_proposal' }));
    expect(res.status).toBe(400);
    expect((await json(res)).error.code).toBe('invalid_proposal');
  });

  it('a signed token is re-priced: the price inside it is ignored', async () => {
    const { post, leads } = setup();
    const token = await signProposalToken(baseEnv.SERVER_KEY, payload);
    const res = await post(lead({ source: 'web_proposal', proposalToken: token }));
    expect(res.status).toBe(201);
    const stored = leads.payloads[0]!;
    expect(stored.pack_code).toBe('P2');
    expect(stored.ai_proposal).toMatchObject({ pack: 'P2', priceFrom: 1400, pricingVersion: '2026-09-14', extras: ['seo_basic'], isApp: false });
  });

  it('a proposal whose pack was taken off sale since still creates the lead, flagged pack_inactive in meta', async () => {
    const { post, leads, deps } = setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pricing = createFakePricing();
    pricing.data.packs.find((p) => p.code === 'P2')!.active = false;
    const token = await signProposalToken(baseEnv.SERVER_KEY, payload);
    const res = await post(lead({ source: 'web_proposal', proposalToken: token }), { deps: { ...deps, pricing } });
    expect(res.status).toBe(201);
    expect(leads.payloads[0]!.meta).toMatchObject({ pack_inactive: true });
  });

  it('an app proposal sets ai_proposal but no pack_code', async () => {
    const { post, leads } = setup();
    const token = await signProposalToken(baseEnv.SERVER_KEY, { ...payload, pack: 'APP_MVP', isApp: true, extras: [] });
    await post(lead({ source: 'web_proposal', proposalToken: token }));
    expect(leads.payloads[0]!.pack_code).toBeUndefined();
    expect(leads.payloads[0]!.ai_proposal).toMatchObject({ pack: 'APP_MVP', isApp: true, priceFrom: 4000 });
  });

  it('forged, re-signed with another key, expired or truncated tokens are 400 invalid_proposal', async () => {
    const { post, leads } = setup();
    const good = await signProposalToken(baseEnv.SERVER_KEY, payload);
    const [body, sig] = good.split('.') as [string, string];
    const forgedBody = btoa(JSON.stringify({ ...payload, pack: 'P1' })).replace(/=+$/, '');
    const tokens = [
      `${forgedBody}.${sig}`,
      await signProposalToken('another-key-another-key-another-key', payload),
      await signProposalToken(baseEnv.SERVER_KEY, { ...payload, exp: 1 }),
      `${body}.${sig.slice(0, 10)}`,
      `${body}`.padEnd(30, 'a'),
    ];
    for (const proposalToken of tokens) {
      const res = await post(lead({ source: 'web_proposal', proposalToken }));
      expect(res.status).toBe(400);
      expect((await json(res)).error.code).toBe('invalid_proposal');
    }
    expect(leads.payloads).toHaveLength(0);
  });
});

describe('POST /leads: affiliates', () => {
  it('a known code is stored', async () => {
    const { post, leads } = setup();
    await post(lead({ affiliateCode: CODE.toLowerCase() }));
    expect(leads.payloads[0]!.affiliate_code).toBe(CODE);
    expect(leads.payloads[0]!.meta).toEqual({});
  });

  it('a self-referral is saved with the code and flagged, not rejected', async () => {
    const { post, leads } = setup();
    const res = await post(lead({ affiliateCode: CODE, contact: { name: 'Ana', email: 'ANA@example.com' } }));
    expect(res.status).toBe(201);
    expect(leads.payloads[0]).toMatchObject({ affiliate_code: CODE, meta: { self_referral_suspect: true } });
  });

  it('an unknown code (valid format) still creates the lead; the RPC keeps it in meta', async () => {
    const { post, leads } = setup();
    expect((await post(lead({ affiliateCode: 'NOPE-AB12CD' }))).status).toBe(201);
    expect(leads.payloads[0]!.affiliate_code).toBeUndefined();
    expect(leads.payloads[0]!.meta).toMatchObject({ affiliate_code_rejected: 'NOPE-AB12CD' });
  });

  it('a malformed code never loses the lead and is not forwarded', async () => {
    const { post, leads } = setup();
    expect((await post(lead({ affiliateCode: "'; drop table leads;--" }))).status).toBe(201);
    expect(leads.payloads[0]!.affiliate_code).toBeUndefined();
    expect(leads.payloads[0]!.meta).toEqual({ invalid_ref: true });
  });

  it('the owner lookup failing does not lose the lead', async () => {
    const { post, leads, deps } = setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await post(lead({ affiliateCode: CODE }), {
      deps: { ...deps, affiliates: { findOwner: async () => { throw new Error('db down'); }, userEmail: async () => null } },
    });
    expect(res.status).toBe(201);
    expect(leads.payloads[0]!.affiliate_code).toBe(CODE);
  });
});

describe('POST /leads: session and failures', () => {
  it('links the user of a valid bearer token and ignores an invalid one', async () => {
    const { post, leads } = setup();
    await post(lead(), { headers: { authorization: 'Bearer jwt-marta' } });
    expect(leads.payloads[0]!.user_id).toBe(MARTA_ID);
    await post(lead({ idempotencyKey: '4f6c0a52-5a6e-4c1e-9d56-6c7f5a1b2c3d' }), { headers: { authorization: 'Bearer garbage' } });
    expect(leads.payloads[1]!.user_id).toBeUndefined();
  });

  it('a database failure is a generic 502: no SQL text in the body or the logs', async () => {
    const { post, leads } = setup();
    leads.failWith = new Error('duplicate key value violates unique constraint "leads_idempotency_key_key"');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await post();
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toMatch(/constraint|leads_idempotency/);
    expect(log.mock.calls.join()).not.toMatch(/constraint|marta/);
  });

  it('no service role configured -> 503', async () => {
    const { post, deps } = setup();
    expect((await post(lead(), { deps: { ...deps, leads: undefined } })).status).toBe(503);
  });
});

describe('GET /affiliates/validate', () => {
  const get = (query: string, extra: Parameters<typeof call>[2] = {}) => {
    const { deps } = setup();
    return call('GET', `/api/v1/affiliates/validate${query}`, { deps, ...extra });
  };

  it('valid for a known code (any case), invalid for unknown or malformed ones', async () => {
    expect((await json(await get(`?code=${CODE}`))).data).toEqual({ valid: true });
    expect((await json(await get(`?code=${CODE.toLowerCase()}`))).data).toEqual({ valid: true });
    expect((await json(await get('?code=ZZZ-0000'))).data).toEqual({ valid: false });
    expect((await json(await get('?code=NOPE-AB12CD'))).data).toEqual({ valid: false });
    expect((await json(await get(`?code=${encodeURIComponent("' or 1=1")}`))).data).toEqual({ valid: false });
  });

  it('400 without a code and 429 over the rate limit', async () => {
    expect((await get('')).status).toBe(400);
    const limited = await get(`?code=${CODE}`, { env: { AFFILIATE_RATE_LIMITER: { limit: async () => ({ success: false }) } } });
    expect(limited.status).toBe(429);
  });

  it('is never cached', async () => {
    expect((await get(`?code=${CODE}`)).headers.get('cache-control')).toBe('no-store');
  });
});
