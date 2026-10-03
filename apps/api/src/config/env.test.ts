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
      NOTIFY_SHARED_SECRET: 'notify-secret',
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
});
