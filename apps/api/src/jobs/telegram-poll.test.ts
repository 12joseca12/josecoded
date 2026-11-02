import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_UPDATES, pollTelegramUpdates } from './telegram-poll';
import { createFakeClock } from '../../test/fakes/clock.fake';
import { createFakeQuota, createFakeStaffTelegram, createFakeTelegram } from '../../test/fakes/ports.fake';
import { LINKED_REPLY, REJECTED_REPLY } from '../services/telegram-link';
import { createSubrequestBudget } from '../utils/subrequest-budget';

import type { TelegramInbox } from '../adapters/telegram';
import type { Deps } from '../deps';
import type { Env } from '../types/env.types';
import type { TelegramUpdate } from '../utils/telegram-update';

const env = { API_MODE: 'development', CORS_ORIGINS: '', SUPABASE_URL: 'http://127.0.0.1:54321' } satisfies Env;

const update = (id: number, text: string | undefined, chat = { id: 555, type: 'private' }): TelegramUpdate => ({
  update_id: id,
  message: { text, chat },
});

function setup(updates: TelegramUpdate[], codes: Record<string, string> = { ABCDEFGH: 'user-carla' }) {
  let pending = [...updates];
  const offsets: number[] = [];
  const inbox: TelegramInbox = {
    async getUpdates(offset, limit) {
      offsets.push(offset);
      if (offset) pending = pending.filter((u) => u.update_id >= offset);
      return pending.slice(0, limit);
    },
  };
  const staffTelegram = createFakeStaffTelegram(codes);
  const telegram = createFakeTelegram();
  const quota = createFakeQuota();
  const deps = { clock: createFakeClock(), telegramInbox: inbox, staffTelegram, telegram, quota } as unknown as Deps;
  const run = (extra: Partial<Env> = {}, limit = 40) =>
    pollTelegramUpdates({ env: { ...env, ...extra }, deps, budget: createSubrequestBudget(fetch, limit), fetch, now: new Date() });
  return { run, offsets, staffTelegram, telegram, quota, deps };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('telegram.poll_updates', () => {
  it('links the chat that sends /start <code> and answers it', async () => {
    const { run, staffTelegram, telegram } = setup([update(10, '/start ABCDEFGH')]);
    await run();
    expect(staffTelegram.links.get('user-carla')).toBe('555');
    expect(telegram.calls).toEqual([{ text: LINKED_REPLY, chatId: '555' }]);
  });

  it('ignores everything else without answering: other commands, plain text, groups, empty messages', async () => {
    const { run, staffTelegram, telegram } = setup([
      update(1, '/start'),
      update(2, '/help ABCDEFGH'),
      update(3, 'hola'),
      update(4, '/start ABCDEFGH', { id: -100, type: 'group' }),
      update(5, undefined),
      update(6, '/start ABCDEFGHI'),
      update(7, '/start ABC DEFGH'),
    ]);
    await run();
    expect(staffTelegram.attempts).toEqual([]);
    expect(telegram.calls).toEqual([]);
  });

  it('a wrong or expired code is refused with a fixed reply and links nothing', async () => {
    const { run, staffTelegram, telegram } = setup([update(1, '/start ZZZZZZZZ')]);
    await run();
    expect(staffTelegram.links.size).toBe(0);
    expect(telegram.calls).toEqual([{ text: REJECTED_REPLY, chatId: '555' }]);
  });

  it('accepts the deep-link form with the bot name and any case', async () => {
    const { run, staffTelegram } = setup([update(1, '/start@josecoded_bot abcdefgh')]);
    await run();
    expect(staffTelegram.attempts).toEqual([{ code: 'abcdefgh', chatId: '555' }]);
    expect(staffTelegram.links.get('user-carla')).toBe('555');
  });

  it('confirms the updates before processing them (at most once) and does not see them again', async () => {
    const { run, offsets, staffTelegram } = setup([update(10, '/start ABCDEFGH'), update(11, 'hola')]);
    await run();
    expect(offsets).toEqual([0, 12]);
    await run();
    expect(staffTelegram.attempts).toHaveLength(1);
  });

  it('limits the attempts per chat so a code cannot be guessed', async () => {
    const { run, staffTelegram } = setup(Array.from({ length: 8 }, (_, i) => update(i + 1, `/start AAAAAAA${i}`)));
    await run(); // 8 updates in one batch
    expect(staffTelegram.attempts).toHaveLength(5);
  });

  it('is a no-op in webhook mode (Telegram refuses getUpdates then)', async () => {
    const { run, offsets } = setup([update(1, '/start ABCDEFGH')]);
    await run({ TELEGRAM_WEBHOOK_SECRET: 'a-long-enough-webhook-secret' });
    expect(offsets).toEqual([]);
  });

  it('is a no-op without the inbox or the link RPC', async () => {
    const { deps } = setup([]);
    const budget = createSubrequestBudget(fetch, 40);
    await pollTelegramUpdates({ env, deps: { ...deps, telegramInbox: undefined }, budget, fetch, now: new Date() });
    await pollTelegramUpdates({ env, deps: { ...deps, staffTelegram: undefined }, budget, fetch, now: new Date() });
    expect(budget.used).toBe(0);
  });

  it('costs one call when there is nothing to read, and never more than its budget', async () => {
    const empty = setup([]);
    await empty.run();
    expect(empty.offsets).toEqual([0]);

    const busy = setup(Array.from({ length: MAX_UPDATES }, (_, i) => update(i + 1, `/start AAAAAAA${i}`)));
    const budget = createSubrequestBudget(fetch, 12);
    await pollTelegramUpdates({ env, deps: busy.deps, budget, fetch, now: new Date() });
    expect(budget.used).toBeLessThanOrEqual(12);
  });
});
