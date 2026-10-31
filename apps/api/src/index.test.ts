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

test('GET /api/v1/health succeeds with empty bindings in development (local wrangler)', async () => {
  const res = await app.request('http://localhost/api/v1/health', {}, {});
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok: boolean };
  expect(json.ok).toBe(true);
});

test('GET /api/v1/health succeeds with partial wrangler vars (no Omen, no Supabase)', async () => {
  const partial = {
    API_MODE: 'development',
    CORS_ORIGINS: 'http://localhost:3000',
  };
  const res = await app.request('http://localhost/api/v1/health', {}, partial);
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok: boolean };
  expect(json.ok).toBe(true);
});

const noWorkerEnv: Record<string, string> = { ...baseEnv };
delete noWorkerEnv.WORKER_URL;
delete noWorkerEnv.WORKER_INTERNAL_TOKEN;

test('the gateway runs without Omen: health answers in production with no WORKER_* values', async () => {
  const res = await app.request('http://localhost/api/v1/health', {}, { ...noWorkerEnv, API_MODE: 'production' });
  expect(res.status).toBe(200);
});

test('dev proxy is a 404 when WORKER_URL is missing, even with a dev key', async () => {
  const res = await app.request(
    'http://localhost/api/dev/worker/system/status',
    { headers: { 'x-dev-api-key': 'dev-key-1234567' } },
    { ...noWorkerEnv, DEV_API_KEY: 'dev-key-1234567' },
  );
  expect(res.status).toBe(404);
});

test('dev proxy is a 404 when DEV_API_KEY is missing', async () => {
  const res = await app.request('http://localhost/api/dev/worker/system/status', {}, baseEnv);
  expect(res.status).toBe(404);
});

test('dev proxy is a 404 in production even with WORKER_URL and DEV_API_KEY', async () => {
  const res = await app.request(
    'http://localhost/api/dev/worker/system/status',
    { headers: { 'x-dev-api-key': 'dev-key-1234567' } },
    { ...baseEnv, API_MODE: 'production', DEV_API_KEY: 'dev-key-1234567' },
  );
  expect(res.status).toBe(404);
});

test('dev proxy answers 401 without the key when it is mounted (worker + key + development)', async () => {
  const res = await app.request(
    'http://localhost/api/dev/worker/system/status',
    {},
    { ...baseEnv, DEV_API_KEY: 'dev-key-1234567' },
  );
  expect(res.status).toBe(401);
});

test('a lone WORKER_URL (without the token) is a misconfiguration: 500, not a half-working proxy', async () => {
  const res = await app.request(
    'http://localhost/api/v1/health',
    {},
    { ...noWorkerEnv, WORKER_URL: 'https://example.com' },
  );
  expect(res.status).toBe(500);
});
