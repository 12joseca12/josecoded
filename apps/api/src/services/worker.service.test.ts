import { afterEach, describe, expect, it, vi } from 'vitest';

import { callWorker, isWorkerConfigured, toUpstreamFail, WorkerNotConfiguredError } from './worker.service';

import type { Env } from '../types/env.types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'https://worker.test',
  WORKER_INTERNAL_TOKEN: 'current-internal-token',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'https://example.supabase.co',
} satisfies Env;

const unconfigured: Env = {
  API_MODE: 'production',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'https://example.supabase.co',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isWorkerConfigured', () => {
  it('needs both the url and the token', () => {
    expect(isWorkerConfigured(env)).toBe(true);
    expect(isWorkerConfigured(unconfigured)).toBe(false);
    expect(isWorkerConfigured({ ...unconfigured, WORKER_URL: 'https://worker.test' })).toBe(false);
  });
});

describe('callWorker', () => {
  it('without WORKER_URL/WORKER_INTERNAL_TOKEN it throws a 503 worker_not_configured and never calls fetch', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const error = await callWorker(unconfigured, '/system/status').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WorkerNotConfiguredError);
    expect(error).toMatchObject({ status: 503 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the bearer token and returns the parsed body', async () => {
    const fetchSpy = vi.fn(async () => json(200, { ok: true, data: 1 }));
    vi.stubGlobal('fetch', fetchSpy);

    const data = await callWorker(env, 'system/status');

    expect(data).toEqual({ ok: true, data: 1 });
    const call = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe('https://worker.test/system/status');
    expect((call[1].headers as Record<string, string>).Authorization).toBe('Bearer current-internal-token');
  });

  it('does not retry a 401 (no token rotation any more)', async () => {
    const fetchSpy = vi.fn(async () => json(401, { error: 'bad token' }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(callWorker(env, '/x')).rejects.toMatchObject({ status: 401 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('toUpstreamFail', () => {
  it('a timeout no longer talks about the Android emulator', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const body = toUpstreamFail(abort);
    expect(body.error.message).toBe('Gateway timed out waiting for the upstream worker');
    expect(body.error.details).toMatchObject({ backendCode: 'GATEWAY_TIMEOUT' });
  });

  it('maps WorkerNotConfiguredError to the worker_not_configured code', () => {
    expect(toUpstreamFail(new WorkerNotConfiguredError()).error.code).toBe('worker_not_configured');
  });
});
