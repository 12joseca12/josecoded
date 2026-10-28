import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const base = {
  API_MODE: 'development',
  WORKER_URL: 'https://example.com',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key-12345',
};

describe('envSchema additions of plan 1.7', () => {
  it('keeps the new variables (otherwise parseEnv would strip them)', () => {
    const env = parseEnv({
      ...base,
      WORKER_INTERNAL_TOKEN_PREV: 'previous-internal-token',
      TURNSTILE_SECRET_KEY: 'ts-secret',
      SERVER_KEY: 'server-key',
      N8N_LEAD_WEBHOOK_ENABLED: 'true',
      PROPOSALS_DAILY_LIMIT_IP: '5',
      PROPOSALS_DAILY_LIMIT_ALL: '200',
      AI_PROPOSAL_MODEL: '@cf/meta/llama',
      AI_GATEWAY_ID: 'josecoded',
      ALLOWED_TURNSTILE_HOSTNAMES: 'josecoded.com',
      GITHUB_APP_ID: '1',
      GITHUB_APP_INSTALLATION_ID: '2',
      GITHUB_APP_PRIVATE_KEY: 'pem',
    });
    expect(env.WORKER_INTERNAL_TOKEN_PREV).toBe('previous-internal-token');
    expect(env.AI_GATEWAY_ID).toBe('josecoded');
    expect(env.PROPOSALS_DAILY_LIMIT_IP).toBe('5');
    expect(env.GITHUB_APP_PRIVATE_KEY).toBe('pem');
  });

  it('keeps rate limiter bindings as objects and rejects anything else', () => {
    const limiter = { limit: async () => ({ success: true }) };
    const env = parseEnv({
      ...base,
      LEADS_RATE_LIMITER: limiter,
      AFFILIATE_RATE_LIMITER: limiter,
      RADAR_RATE_LIMITER: limiter,
    });
    expect(env.LEADS_RATE_LIMITER).toBe(limiter);
    expect(env.RADAR_RATE_LIMITER).toBe(limiter);
    expect(() => parseEnv({ ...base, LEADS_RATE_LIMITER: 'nope' })).toThrow(/Invalid environment/);
  });

  it('all of them are optional: the legacy minimal env still parses', () => {
    expect(() => parseEnv(base)).not.toThrow();
  });

  it('QUOTA_KV is gone (quotas use the increment_quota RPC, 1.8)', () => {
    const env = parseEnv({ ...base, QUOTA_KV: {} }) as Record<string, unknown>;
    expect(env).not.toHaveProperty('QUOTA_KV');
  });

  it('validates the numeric limits', () => {
    expect(() => parseEnv({ ...base, PROPOSALS_DAILY_LIMIT_IP: 'many' })).toThrow(/Invalid environment/);
  });

  it('removes the leftovers of the Edge Function notify (Q2): NOTIFY_SHARED_SECRET is stripped', () => {
    const env = parseEnv({ ...base, NOTIFY_SHARED_SECRET: 'notify-secret' }) as Record<string, unknown>;
    expect(env).not.toHaveProperty('NOTIFY_SHARED_SECRET');
  });
});

describe('envSchema of plan 1.8c (new Supabase project, outbox, retired forum and admin-chat)', () => {
  it('keeps the secret key, Telegram, Resend, CHAT_SID_SECRET and ADMIN_REQUIRE_MFA', () => {
    const env = parseEnv({
      ...base,
      SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
      TELEGRAM_BOT_TOKEN: '123456:telegram-token',
      TELEGRAM_ADMIN_CHAT_ID: '-1001234567',
      RESEND_API_KEY: 're_0123456789',
      CHAT_SID_SECRET: 'a'.repeat(64),
      ADMIN_REQUIRE_MFA: 'false',
    });
    expect(env).toMatchObject({
      SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
      TELEGRAM_BOT_TOKEN: '123456:telegram-token',
      TELEGRAM_ADMIN_CHAT_ID: '-1001234567',
      RESEND_API_KEY: 're_0123456789',
      CHAT_SID_SECRET: 'a'.repeat(64),
      ADMIN_REQUIRE_MFA: 'false',
    });
  });

  it('rejects a chat id that is not numeric, a short CHAT_SID_SECRET and an ADMIN_REQUIRE_MFA other than true/false', () => {
    expect(() => parseEnv({ ...base, TELEGRAM_ADMIN_CHAT_ID: '@jose' })).toThrow(/Invalid environment/);
    expect(() => parseEnv({ ...base, CHAT_SID_SECRET: 'short' })).toThrow(/Invalid environment/);
    expect(() => parseEnv({ ...base, ADMIN_REQUIRE_MFA: 'no' })).toThrow(/Invalid environment/);
  });

  it('strips the variables of the retired modules and the legacy service role key', () => {
    const env = parseEnv({
      ...base,
      FORUM_USE_MOCK: 'true',
      FORUM_USE_DATABASE: 'true',
      FORUM_MODERATION_DISABLED: 'true',
      FORUM_ADMIN_USER_IDS: 'x',
      ADMIN_SUPERUSER_ID: '25486629-4071-42bb-9447-0ea776ea53ec',
      ADMIN_SUPERUSER_EMAIL: 'admin@example.com',
      N8N_CHAT_WEBHOOK_URL: 'https://n8n.example.com/hook',
      N8N_CHAT_WEBHOOK_SECRET: 'secret-secret',
      ADMIN_CHAT_WORKER_PATH: '/ai/admin-chat',
      PUBLIC_API_BASE_URL: 'https://api.example.com',
      SUPABASE_SERVICE_ROLE_KEY: 'x'.repeat(40),
    }) as Record<string, unknown>;
    for (const key of [
      'FORUM_USE_MOCK',
      'FORUM_USE_DATABASE',
      'FORUM_MODERATION_DISABLED',
      'FORUM_ADMIN_USER_IDS',
      'ADMIN_SUPERUSER_ID',
      'ADMIN_SUPERUSER_EMAIL',
      'N8N_CHAT_WEBHOOK_URL',
      'N8N_CHAT_WEBHOOK_SECRET',
      'ADMIN_CHAT_WORKER_PATH',
      'PUBLIC_API_BASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]) {
      expect(env, key).not.toHaveProperty(key);
    }
  });

  it('a malformed value of a retired variable no longer breaks the env', () => {
    expect(() => parseEnv({ ...base, ADMIN_SUPERUSER_EMAIL: 'not-an-email' })).not.toThrow();
  });
});
