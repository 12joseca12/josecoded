// outbox.drain end to end inside workerd: the real scheduled() entry point, buildDeps, the supabase-js adapters and
// the Telegram adapter, with the global fetch answered by an in-memory Supabase (RPCs that mirror the SQL of
// 20261028100000_base.sql) and a fake Telegram. This is the offline stand-in for step 3 of plan 1.8c
// (`wrangler dev --test-scheduled` against Supabase local), which runs on the Mac.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabase, type FakeSupabase } from './fakes/supabase-rest.fake';
import { batchLimit, formatOutboxEvent, MAX_BATCH, noticeKey } from '../src/jobs/outbox-drain';
import { scheduled } from '../src/scheduled';

import type { Env } from '../src/types/env.types';

const SECRET = 'sb_secret_test_0123456789abcdef';
const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
  SUPABASE_SECRET_KEY: SECRET,
  TELEGRAM_BOT_TOKEN: '123456:test-bot-token',
  TELEGRAM_ADMIN_CHAT_ID: '4242',
} satisfies Env;

const controller = { cron: '*/5 * * * *', scheduledTime: Date.now(), noRetry: () => undefined } as ScheduledController;

let sb: FakeSupabase;

/** One Cron Trigger tick with outbox.drain due (the seed row of the base migration). */
async function tick(bindings: Partial<Env> = {}) {
  for (const job of sb.jobs) job.next_run_at = new Date(Date.now() - 60_000).toISOString();
  await scheduled(controller, { ...env, ...bindings } as Env);
}

const comment = { id: 'c1', post_slug: 'hola', locale: 'es', author_name: 'Bob' };

beforeEach(() => {
  sb = createFakeSupabase({ secret: SECRET });
  sb.jobs.push({ name: 'outbox.drain', cron: '* * * * *', tz: null, next_run_at: new Date().toISOString(), enabled: true });
  vi.stubGlobal('fetch', sb.fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('formatOutboxEvent: untrusted text', () => {
  const at = (event: string, payload: Record<string, unknown>) => ({ id: 1, event, payload, attempts: 1, createdAt: new Date() });

  it('an unknown event shows its name and id, never the payload', () => {
    const out = formatOutboxEvent(at('mystery.thing', { id: 7, secret: 'hunter2', email: 'a@b.co' }));
    expect(out).toBe('mystery.thing\nid 7');
  });

  it('visitor-controlled fields are cut to 60 characters, single line and quoted', () => {
    const long = 'A'.repeat(200);
    const comment = formatOutboxEvent(at('comment.pending', { id: 'c', post_slug: 's', locale: 'es', author_name: `x\ny ${long}` }));
    expect(comment).toContain('«x y ' + 'A'.repeat(55) + '…»');
    expect(comment).not.toContain('A'.repeat(61));
    const asset = formatOutboxEvent(at('asset.uploaded', { id: 'f', client_id: 'c', size_bytes: 1, file_name: long }));
    expect(asset).toContain(`«${'A'.repeat(59)}…»`);
  });
});

describe('outbox.drain', () => {
  it('delivers an event to Jose by Telegram and acks it after the 200', async () => {
    const row = sb.enqueue('comment.pending', comment);

    await tick();

    expect(sb.telegram).toEqual([{ chatId: '4242', text: formatOutboxEvent({ ...row, createdAt: new Date(), payload: comment }) }]);
    expect(sb.telegram[0]?.text).toContain('Bob');
    expect(row).toMatchObject({ attempts: 1, last_error: null });
    expect(row.delivered_at).not.toBeNull();
    expect(sb.rpcCalls).toEqual(['scheduled_jobs_due', 'outbox_claim', 'outbox_ack', 'scheduled_jobs_mark_ran']);
    // the job was rescheduled to the next minute
    expect(Date.parse(sb.jobs[0]?.next_run_at ?? '')).toBeGreaterThan(Date.now());
  });

  it('records a failure after a 500 from Telegram, releases the claim and delivers on a later tick', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const row = sb.enqueue('comment.pending', comment);
    sb.telegramStatus = 500;

    await tick();

    expect(row).toMatchObject({ attempts: 1, delivered_at: null, dead_at: null, claimed_by: null });
    expect(row.last_error).toBe('telegram sendMessage 500: Bad Gateway');
    expect(row.last_error).not.toContain(env.TELEGRAM_BOT_TOKEN);
    expect(sb.rpcCalls).toContain('outbox_fail');

    sb.telegramStatus = 200;
    await tick();

    expect(row.attempts).toBe(2);
    expect(row.delivered_at).not.toBeNull();
    expect(sb.telegram).toHaveLength(1);
  });

  it('at the 10th failed attempt the SQL dead-letters the event and the next drain tells Jose (system.outbox_dead)', async () => {
    const row = sb.enqueue('asset.uploaded', { id: 'a1', client_id: 'cl1', file_name: 'logo.png', size_bytes: 10 });
    row.attempts = 9;
    sb.telegramStatus = 500;

    await tick();

    expect(row.attempts).toBe(10);
    expect(row.dead_at).not.toBeNull();
    const dead = sb.outbox.filter((o) => o.event === 'system.outbox_dead');
    expect(dead).toHaveLength(1);
    expect(dead[0]?.payload).toEqual({ id: row.id, event: 'asset.uploaded', last_error: 'telegram sendMessage 500: Bad Gateway' });

    sb.telegramStatus = 200;
    await tick();

    expect(sb.telegram.map((m) => m.text)).toEqual([
      `Aviso perdido tras 10 intentos: asset.uploaded #${row.id}.\nÚltimo error: telegram sendMessage 500: Bad Gateway`,
    ]);
    expect(dead[0]?.delivered_at).not.toBeNull();
    // the dead event itself is never claimed again
    expect(row.delivered_at).toBeNull();
    expect(row.attempts).toBe(10);
  });

  it('lead.created and chat.* events already notified by their request are acked without a second Telegram', async () => {
    const lead = sb.enqueue('lead.created', { id: 'lead-1', contact_id: 'ct-1', source: 'proposal', via: 'client', pack_code: 'P2' });
    const chat = sb.enqueue('chat.some_future_event', { id: 'msg-1' });
    const fresh = sb.enqueue('lead.created', { id: 'lead-2', contact_id: 'ct-2', source: 'contact', via: 'client', pack_code: null });
    // what the request path does after its own Telegram (NoticeLedger.markSent)
    sb.quota.set('notice:lead.created:lead-1', { count: 1, expiresAt: sb.now() + 7 * 86_400_000 });
    sb.quota.set('notice:chat.some_future_event:msg-1', { count: 1, expiresAt: sb.now() + 7 * 86_400_000 });

    await tick();

    expect(sb.telegram.map((m) => m.text)).toEqual([`Nuevo lead (contact).\nLead lead-2 · contacto ct-2`]);
    for (const row of [lead, chat, fresh]) expect(row.delivered_at).not.toBeNull();
  });

  it('chat.visitor_message is grouped: one Telegram per thread every 10 minutes, the rest acked unsent', async () => {
    const msg = (id: string, thread: string) => sb.enqueue('chat.visitor_message', { id, thread_id: thread, case: 'client', locale: 'es' });
    const rows = [msg('m1', 'th-a'), msg('m2', 'th-a'), msg('m3', 'th-b'), msg('m4', 'th-a')];

    await tick();

    expect(sb.telegram.map((m) => m.text)).toEqual([
      'Mensaje nuevo en el chat (client, es).\nHilo th-a',
      'Mensaje nuevo en el chat (client, es).\nHilo th-b',
    ]);
    for (const row of rows) expect(row.delivered_at).not.toBeNull();

    // 10 minutes later the thread notifies again
    sb.advance(10 * 60_000 + 1000);
    const later = msg('m5', 'th-a');
    await tick();
    expect(sb.telegram).toHaveLength(3);
    expect(later.delivered_at).not.toBeNull();
  });

  it('claims nothing without Telegram configured (a claim would spend one of the 10 attempts)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const row = sb.enqueue('comment.pending', comment);

    await tick({ TELEGRAM_BOT_TOKEN: undefined });

    expect(row.attempts).toBe(0);
    expect(sb.rpcCalls).not.toContain('outbox_claim');
    expect(warn).toHaveBeenCalled();
  });

  it('claims only what the tick budget can settle, oldest first; the rest wait for the next tick', async () => {
    // 40 per tick minus listDue and the reserved markRan of the dispatcher
    const perTick = batchLimit(38);
    expect(perTick).toBe(12);
    const rows = Array.from({ length: perTick + 5 }, (_, i) => sb.enqueue('comment.pending', { ...comment, id: `c${i}` }));

    await tick();

    expect(rows.filter((r) => r.delivered_at !== null)).toEqual(rows.slice(0, perTick));
    expect(rows.slice(perTick).every((r) => r.attempts === 0)).toBe(true);
    // 1 listDue + 1 claim + 12 Telegram + 1 ack + 1 markRan
    expect(sb.requests).toHaveLength(16);

    await tick();
    expect(rows.every((r) => r.delivered_at !== null)).toBe(true);
  });

  it('batchLimit never exceeds MAX_BATCH and claims nothing when even one event would not fit', () => {
    expect(batchLimit(1000)).toBe(MAX_BATCH);
    expect(batchLimit(5)).toBe(1);
    expect(batchLimit(4)).toBe(0);
    expect(batchLimit(-1)).toBe(0);
  });

  it('without SUPABASE_SECRET_KEY the dispatcher has no repo and touches nothing', async () => {
    sb.enqueue('comment.pending', comment);
    await tick({ SUPABASE_SECRET_KEY: undefined });
    expect(sb.requests).toEqual([]);
  });
});

describe('formatOutboxEvent and noticeKey', () => {
  const at = new Date();
  it.each([
    ['lead.created', { id: 'l', contact_id: 'c', source: 'proposal', pack_code: 'P3' }, 'Nuevo lead (proposal · P3).\nLead l · contacto c'],
    ['comment.pending', comment, 'Comentario pendiente de moderar de «Bob» en «hola» (es).\nComentario c1'],
    ['asset.uploaded', { id: 'f', client_id: 'k', file_name: 'a.pdf', size_bytes: 3 }, 'Material nuevo del cliente k: «a.pdf» (3 bytes).\nFichero f'],
    [
      'upgrade.requested',
      { id: 'u', client_id: 'k', from_pack_code: 'P2', to_pack_code: 'P3', computed_price: 400 },
      'Ampliación solicitada: P2 → P3 (400 €).\nCliente k · solicitud u',
    ],
    ['chat.visitor_message', { id: 'm', thread_id: 't', case: 'curious', locale: 'en' }, 'Mensaje nuevo en el chat (curious, en).\nHilo t'],
    ['radar.new', { id: 9, a: 1 }, 'radar.new\nid 9'],
  ])('%s', (event, payload, expected) => {
    expect(formatOutboxEvent({ id: 1, event, payload, attempts: 1, createdAt: at })).toBe(expected);
  });

  it('keys only lead.created and chat.* by payload.id', () => {
    const ev = (event: string, payload: Record<string, unknown>) => ({ id: 1, event, payload, attempts: 1, createdAt: at });
    expect(noticeKey(ev('lead.created', { id: 'l1' }))).toBe('lead.created:l1');
    expect(noticeKey(ev('chat.visitor_message', { id: 'm1' }))).toBe('chat.visitor_message:m1');
    expect(noticeKey(ev('comment.pending', { id: 'c1' }))).toBeUndefined();
    expect(noticeKey(ev('lead.created', {}))).toBeUndefined();
  });
});
