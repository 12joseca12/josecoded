import { afterEach, describe, expect, it, vi } from 'vitest';

const valid = {
  NEXT_PUBLIC_SITE_URL: 'https://josecoded.com',
  NEXT_PUBLIC_JOSECODED_API_URL: 'https://api.josecoded.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  NEXT_PUBLIC_CAL_LINK: 'josecoded/20min',
  NEXT_PUBLIC_WHATSAPP_NUMBER: '34600000000',
  NEXT_PUBLIC_HERO_MEDIA_VERSION: '1',
};

function stubValidEnv() {
  for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('env', () => {
  it('fails fast when a public var is missing, naming it', async () => {
    stubValidEnv();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    await expect(import('../lib/env')).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it('fails when a public var is not a URL, naming it', async () => {
    stubValidEnv();
    vi.stubEnv('NEXT_PUBLIC_JOSECODED_API_URL', 'not a url');
    await expect(import('../lib/env')).rejects.toThrow(/NEXT_PUBLIC_JOSECODED_API_URL/);
  });

  it('parses the public vars and keeps the optional ones optional', async () => {
    stubValidEnv();
    const { env } = await import('../lib/env');
    expect(env.client.NEXT_PUBLIC_SITE_URL).toBe('https://josecoded.com');
    expect(env.client.NEXT_PUBLIC_UMAMI_WEBSITE_ID).toBeUndefined();
    expect(env.client.NEXT_PUBLIC_DEV_UI).toBeUndefined();
  });

  it('accepts NEXT_PUBLIC_DEV_UI only as "1"', async () => {
    stubValidEnv();
    vi.stubEnv('NEXT_PUBLIC_DEV_UI', '1');
    expect((await import('../lib/env')).env.client.NEXT_PUBLIC_DEV_UI).toBe('1');
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_DEV_UI', 'yes');
    await expect(import('../lib/env')).rejects.toThrow(/NEXT_PUBLIC_DEV_UI/);
  });

  it('reads server secrets lazily and names the missing one', async () => {
    stubValidEnv();
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'x');
    vi.stubEnv('SERVER_KEY', 'x');
    vi.stubEnv('CALCOM_WEBHOOK_SECRET', '');
    const { env } = await import('../lib/env');
    expect(() => env.server.SERVER_KEY).toThrow(/CALCOM_WEBHOOK_SECRET/);
    vi.stubEnv('CALCOM_WEBHOOK_SECRET', 'x');
    expect(env.server.SERVER_KEY).toBe('x');
  });

  it('has no service role key in the web env', async () => {
    stubValidEnv();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'secret');
    const { env } = await import('../lib/env');
    expect(JSON.stringify(env.client)).not.toMatch(/service/i);
    expect('SUPABASE_SERVICE_ROLE_KEY' in env.client).toBe(false);
  });
});
