import { afterEach, describe, expect, it, vi } from 'vitest';

import { callWorker, fetchWorkerResponse, toUpstreamFail } from './worker.service';

import type { Env } from '../types/env.types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'https://worker.test',
  WORKER_INTERNAL_TOKEN: 'current-internal-token',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'https://example.supabase.co',
} satisfies Env;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const authOf = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('internal token rotation (WORKER_INTERNAL_TOKEN_PREV)', () => {
  it('sends only the current token when there is no previous one, and does not retry a 401', async () => {
    const fetchSpy = vi.fn(async () => json(401, { error: 'bad token' }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(callWorker(env, '/system/status')).rejects.toMatchObject({ status: 401 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(authOf(fetchSpy.mock.calls[0] ?? []).Authorization).toBe('Bearer current-internal-token');
  });

  it('retries once with the previous token when the backend answers 401', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(json(401, { error: 'bad token' }))
      .mockResolvedValueOnce(json(200, { ok: true, data: 7 }));
    vi.stubGlobal('fetch', fetchSpy);

    const data = await callWorker(
      { ...env, WORKER_INTERNAL_TOKEN_PREV: 'previous-internal-token' },
      '/ai/admin-chat',
      { method: 'POST', body: { q: 1 } },
    );

    expect(data).toEqual({ ok: true, data: 7 });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(authOf(fetchSpy.mock.calls[0] ?? []).Authorization).toBe('Bearer current-internal-token');
    expect(authOf(fetchSpy.mock.calls[1] ?? []).Authorization).toBe('Bearer previous-internal-token');
    // the body travels again, intact
    expect((fetchSpy.mock.calls[1]?.[1] as RequestInit).body).toBe('{"q":1}');
  });

  it('cancels the body of the 401 before retrying, so the first connection is released', async () => {
    const cancel = vi.fn(async () => undefined);
    const rejected = json(401, { error: 'bad token' });
    const stream = rejected.body;
    if (!stream) throw new Error('expected a body');
    vi.spyOn(stream, 'cancel').mockImplementation(cancel);
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(rejected)
      .mockImplementationOnce(async () => {
        // already released when the retry goes out
        expect(cancel).toHaveBeenCalledTimes(1);
        return json(200, { ok: true });
      });
    vi.stubGlobal('fetch', fetchSpy);

    await callWorker({ ...env, WORKER_INTERNAL_TOKEN_PREV: 'previous-internal-token' }, '/x');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('does not use the previous token when the current one works', async () => {
    const fetchSpy = vi.fn(async () => json(200, { ok: true }));
    vi.stubGlobal('fetch', fetchSpy);

    await fetchWorkerResponse({ ...env, WORKER_INTERNAL_TOKEN_PREV: 'previous-internal-token' }, '/health');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry other failures (5xx) with the previous token', async () => {
    const fetchSpy = vi.fn(async () => json(500, { error: 'boom' }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      callWorker({ ...env, WORKER_INTERNAL_TOKEN_PREV: 'previous-internal-token' }, '/x'),
    ).rejects.toMatchObject({ status: 500 });
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
});
