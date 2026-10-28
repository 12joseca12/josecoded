import { describe, expect, it } from 'vitest';

import { createTelegramNotifier } from './telegram';

import type { Env } from '../types/env.types';

const TOKEN = '123456:secret-bot-token';
const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  TELEGRAM_BOT_TOKEN: TOKEN,
  TELEGRAM_ADMIN_CHAT_ID: '-100123',
} satisfies Env;

describe('createTelegramNotifier', () => {
  it('is undefined unless both the token and the chat id are set', () => {
    expect(createTelegramNotifier({ ...env, TELEGRAM_BOT_TOKEN: undefined })).toBeUndefined();
    expect(createTelegramNotifier({ ...env, TELEGRAM_ADMIN_CHAT_ID: ' ' })).toBeUndefined();
    expect(createTelegramNotifier(env)).toBeDefined();
  });

  it('posts plain text to the admin chat (no parse_mode) and caps the length', async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const notifier = createTelegramNotifier(env, async (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
      return Response.json({ ok: true });
    });

    await notifier?.sendMessage('x'.repeat(5000));

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(calls[0]?.body).toMatchObject({ chat_id: '-100123', disable_web_page_preview: true });
    expect(calls[0]?.body).not.toHaveProperty('parse_mode');
    expect(String(calls[0]?.body.text)).toHaveLength(4000);
  });

  it('throws on a non-2xx answer with the status and description, never the token', async () => {
    const notifier = createTelegramNotifier(env, async () =>
      Response.json({ ok: false, description: 'Too Many Requests: retry after 3' }, { status: 429 }),
    );
    const error = await notifier?.sendMessage('hi').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('telegram sendMessage 429: Too Many Requests: retry after 3');
    expect((error as Error).message).not.toContain(TOKEN);
  });

  it('hides the token when fetch itself fails (its error may carry the URL)', async () => {
    const notifier = createTelegramNotifier(env, async (input) => {
      throw new TypeError(`fetch failed: ${String(input)}`);
    });
    const error = await notifier?.sendMessage('hi').catch((e: unknown) => e);
    expect((error as Error).message).toBe('telegram sendMessage network error');
    expect((error as Error).message).not.toContain(TOKEN);
  });
});
