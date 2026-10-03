import { expect, test } from 'vitest';

import { app } from './index';

const baseEnv = {
  API_MODE: 'development',
  WORKER_URL: 'https://example.com',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: 'http://localhost:3000',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key-12345',
} as const;

test('GET /api/v1/health returns ok', async () => {
  const res = await app.request('http://localhost/api/v1/health', {}, baseEnv);
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok: boolean };
  expect(json.ok).toBe(true);
});

test('GET /ai/chat is gone (removed dead route)', async () => {
  const res = await app.request('http://localhost/ai/chat', { method: 'POST' }, baseEnv);
  expect(res.status).toBe(404);
});

test('dev proxy is disabled in production', async () => {
  const res = await app.request(
    'http://localhost/api/dev/worker/system/status',
    { method: 'GET' },
    { ...baseEnv, API_MODE: 'production' },
  );
  expect(res.status).toBe(404);
});

test('v1 protected route requires Authorization', async () => {
  const res = await app.request('http://localhost/api/v1/system/status', {}, baseEnv);
  expect(res.status).toBe(401);
  const json = (await res.json()) as { ok: boolean; error?: { code?: string } };
  expect(json.ok).toBe(false);
  expect(json.error?.code).toBe('unauthorized');
});

test('GET /api/v1/forum/thematics succeeds with empty bindings in development (local wrangler)', async () => {
  const res = await app.request('http://localhost/api/v1/forum/thematics', {}, {});
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok: boolean; data?: unknown };
  expect(json.ok).toBe(true);
  expect(Array.isArray(json.data)).toBe(true);
});

test('GET /api/v1/forum/thematics succeeds with partial wrangler vars (WORKER_URL only)', async () => {
  const partial = {
    API_MODE: 'development',
    WORKER_URL: 'https://example.com',
    CORS_ORIGINS: 'http://localhost:3000',
  };
  const res = await app.request('http://localhost/api/v1/forum/thematics', {}, partial);
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok: boolean; data?: unknown };
  expect(json.ok).toBe(true);
  expect(Array.isArray(json.data)).toBe(true);
});
