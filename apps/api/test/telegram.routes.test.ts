// POST /api/v1/telegram/webhook and POST /api/v1/notify/test through the real app (task 3.8b).
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeClock } from './fakes/clock.fake';
import { createFakeQuota, createFakeStaffTelegram, createFakeTelegram } from './fakes/ports.fake';
import { createFakeSupabaseGateway } from './fakes/supabase.fake';
import { call, json } from './helpers';
import { LINKED_REPLY } from '../src/services/telegram-link';

const SECRET = 'telegram-webhook-secret-0123456789';
const ADMIN = '11111111-1111-4111-8111-111111111111';
const CLOSER = '22222222-2222-4222-8222-222222222222';

function setup() {
  const staffTelegram = createFakeStaffTelegram({ ABCDEFGH: CLOSER });
  const telegram = createFakeTelegram();
  const quota = createFakeQuota();
  const supabase = createFakeSupabaseGateway(
    {
      'jwt-admin': { id: ADMIN, email: 'jose@test', aal: 'aal2' },
      'jwt-admin-aal1': { id: ADMIN, email: 'jose@test', aal: 'aal1' },
      'jwt-closer': { id: CLOSER, email: 'carla@test', aal: 'aal2' },
    },
    [ADMIN],
    [CLOSER],
  );
  const deps = { staffTelegram, telegram, quota, supabase, clock: createFakeClock() };
  return { staffTelegram, telegram, quota, deps };
}

const startMessage = (text: string, extra: Record<string, unknown> = {}) => ({
  update_id: 1,
  message: { text, chat: { id: 9001, type: 'private' }, ...extra },
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('POST /api/v1/telegram/webhook', () => {
  const post = (deps: object, body: unknown, headers: Record<string, string> = {}, secret: string | null = SECRET) =>
    call('POST', '/api/v1/telegram/webhook', { body, deps, headers, env: { TELEGRAM_WEBHOOK_SECRET: secret ?? undefined } });

  it('does not exist without TELEGRAM_WEBHOOK_SECRET', async () => {
    const { deps } = setup();
    const res = await post(deps, startMessage('/start ABCDEFGH'), { 'x-telegram-bot-api-secret-token': SECRET }, null);
    expect(res.status).toBe(404);
  });

  it.each([
    ['no header', {}],
    ['an empty header', { 'x-telegram-bot-api-secret-token': '' }],
    ['a wrong secret', { 'x-telegram-bot-api-secret-token': 'x'.repeat(SECRET.length) }],
    ['a prefix of the secret', { 'x-telegram-bot-api-secret-token': SECRET.slice(0, -1) }],
    ['the secret plus more', { 'x-telegram-bot-api-secret-token': `${SECRET}0` }],
  ])('answers 401 and does nothing with %s', async (_name, headers) => {
    const { deps, staffTelegram } = setup();
    const res = await post(deps, startMessage('/start ABCDEFGH'), headers);
    expect(res.status).toBe(401);
    expect(staffTelegram.attempts).toEqual([]);
  });

  it('links the chat of a valid /start and answers it', async () => {
    const { deps, staffTelegram, telegram } = setup();
    const res = await post(deps, startMessage('/start ABCDEFGH'), { 'x-telegram-bot-api-secret-token': SECRET });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(staffTelegram.links.get(CLOSER)).toBe('9001');
    expect(telegram.calls).toEqual([{ text: LINKED_REPLY, chatId: '9001' }]);
  });

  it('acks (200) updates it does not understand, so Telegram does not retry them, and does nothing', async () => {
    const { deps, staffTelegram, telegram } = setup();
    const headers = { 'x-telegram-bot-api-secret-token': SECRET };
    for (const body of [{ nonsense: true }, { update_id: 2, edited_message: {} }, startMessage('hola'), startMessage('/start ABCDEFGH', { chat: { id: 1, type: 'group' } })]) {
      expect((await post(deps, body, headers)).status).toBe(200);
    }
    expect(staffTelegram.attempts).toEqual([]);
    expect(telegram.calls).toEqual([]);
  });

  it('accepts an update of a few KB, and acks (200) an oversized or non-JSON body after the secret is valid, doing nothing', async () => {
    const { deps, staffTelegram } = setup();
    const headers = { 'x-telegram-bot-api-secret-token': SECRET };
    expect((await post(deps, startMessage('/start ABCDEFGH', { pad: 'x'.repeat(30_000) }), headers)).status).toBe(200);
    expect(staffTelegram.links.get(CLOSER)).toBe('9001');
    const big = await post(deps, { update_id: 1, pad: 'x'.repeat(70_000) }, headers);
    expect(big.status).toBe(200);
    const wrongType = await call('POST', '/api/v1/telegram/webhook', { raw: 'x', headers: { ...headers, 'content-type': 'text/plain' }, deps, env: { TELEGRAM_WEBHOOK_SECRET: SECRET } });
    expect(wrongType.status).toBe(200);
    expect(staffTelegram.attempts).toHaveLength(1);
    // without the secret an oversized body is still a 401, not a free 200
    expect((await post(deps, { update_id: 1, pad: 'x'.repeat(70_000) }, {})).status).toBe(401);
  });

  it('a global quota across chats stops link guessing even from many chats', async () => {
    const { deps, staffTelegram, quota } = setup();
    const headers = { 'x-telegram-bot-api-secret-token': SECRET };
    for (let chat = 1; chat <= 52; chat += 1) {
      await post(deps, { update_id: chat, message: { text: '/start ZZZZZZZZ', chat: { id: chat, type: 'private' } } }, headers);
    }
    expect(staffTelegram.attempts).toHaveLength(50);
    expect(quota.counts.get('tglink:global')).toBe(52);
  });

  it('never logs the message, the chat or the code', async () => {
    const { deps } = setup();
    const logs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await post(deps, startMessage('/start ABCDEFGH'), { 'x-telegram-bot-api-secret-token': SECRET });
    const text = logs.mock.calls.map((c) => String(c[0])).join('\n');
    expect(text).not.toMatch(/ABCDEFGH|9001/);
  });
});

describe('POST /api/v1/notify/test', () => {
  const post = (deps: object, token?: string) =>
    call('POST', '/api/v1/notify/test', { deps, headers: token ? { authorization: `Bearer ${token}` } : {} });

  it('sends the fixed test message to Jose for an admin with aal2', async () => {
    const { deps, telegram } = setup();
    const res = await post(deps, 'jwt-admin');
    expect(res.status).toBe(200);
    expect((await json(res)).data).toEqual({ sent: true });
    expect(telegram.calls).toHaveLength(1);
    expect(telegram.calls[0]?.chatId).toBeUndefined();
  });

  it('refuses no session (401), a closer (403), an admin without the second factor (403)', async () => {
    const { deps, telegram } = setup();
    expect((await post(deps)).status).toBe(401);
    expect((await post(deps, 'jwt-closer')).status).toBe(403);
    const aal1 = await post(deps, 'jwt-admin-aal1');
    expect(aal1.status).toBe(403);
    expect((await json(aal1)).error.details).toEqual({ reason: 'mfa_required' });
    expect(telegram.calls).toEqual([]);
  });

  it('503 without Telegram, 502 when Telegram refuses, 429 after five tests', async () => {
    const { deps, telegram } = setup();
    expect((await post({ ...deps, telegram: undefined }, 'jwt-admin')).status).toBe(503);
    telegram.fail = true;
    expect((await post(deps, 'jwt-admin')).status).toBe(502);
    telegram.fail = false;
    const { deps: fresh } = setup();
    for (let i = 0; i < 5; i += 1) expect((await post(fresh, 'jwt-admin')).status).toBe(200);
    expect((await post(fresh, 'jwt-admin')).status).toBe(429);
  });
});
