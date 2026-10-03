import { describe, expect, it } from 'vitest';

import { app } from './index';

import type { Env } from './types/env.types';

// A route that blows up with a recognizable cause. Registered before the first request (Hono builds its
// router lazily). This file has its own module registry, so the shared `app` is not polluted elsewhere.
app.get('/__boom', () => {
  throw new Error('db password is hunter2');
});

const base = {
  WORKER_URL: 'https://example.com',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key-12345',
} satisfies Partial<Env>;

type Body = { ok: boolean; error: { code: string; message: string; details?: unknown } };

describe('app.onError: the cause of an unexpected error', () => {
  it('is returned as details only in API_MODE=development', async () => {
    const res = await app.request('http://localhost/__boom', {}, { ...base, API_MODE: 'development' });
    expect(res.status).toBe(500);
    const json = (await res.json()) as Body;
    expect(json.error).toMatchObject({ code: 'internal_error', message: 'Internal API error' });
    expect(json.error.details).toBe('db password is hunter2');
  });

  it('is never returned in production', async () => {
    const res = await app.request('http://localhost/__boom', {}, { ...base, API_MODE: 'production' });
    expect(res.status).toBe(500);
    const json = (await res.json()) as Body;
    expect(json.error.code).toBe('internal_error');
    expect(json).not.toHaveProperty('error.details');
    expect(JSON.stringify(json)).not.toContain('hunter2');
  });
});
