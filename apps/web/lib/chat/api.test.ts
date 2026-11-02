import { describe, expect, it, vi } from 'vitest';

import { createChatApi } from './api';

const ID = '3f0f7a1e-8a52-4a8a-9d6f-6d1b2f6f3f10';
const MSG = { id: ID, sender_role: 'assistant', content: 'Hola', message_type: 'text', created_at: '2026-11-02T10:00:00.000Z' };
const THREAD = { id: ID, case: 'client', locale: 'es', status: 'open', ai_enabled: true, context_version: 1 };

function reply(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
}

describe('chat api', () => {
  it('posts with credentials to the assistant route and parses the answer', async () => {
    const fetchImpl = reply(201, { ok: true, data: { threadId: ID, case: 'client', contextVersion: null, aiEnabled: true } });
    const api = createChatApi({ apiUrl: 'https://api.test/', fetchImpl });
    const result = await api.createThread({ case: 'client', locale: 'es', originPath: '/chat', turnstileToken: 'tok' });
    expect(result).toEqual({ status: 'ok', data: { threadId: ID, case: 'client', contextVersion: null, aiEnabled: true } });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/api/v1/assistant/threads');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(init.body as string)).toMatchObject({ turnstileToken: 'tok' });
  });

  it('reads the current thread with the cursor and sends the bearer only when there is a token', async () => {
    const fetchImpl = reply(200, { ok: true, data: { thread: THREAD, messages: [MSG] } });
    const api = createChatApi({ apiUrl: 'https://api.test', fetchImpl, getToken: async () => 'jwt' });
    const result = await api.current('2026-11-02T10:00:00.000Z');
    expect(result.status).toBe('ok');
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/api/v1/assistant/threads/current?after=2026-11-02T10%3A00%3A00.000Z');
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({ authorization: 'Bearer jwt' });
  });

  it.each([
    [403, 'bot_check_failed', 'captcha'],
    [403, 'forbidden', 'forbidden'],
    [429, 'quota_exceeded', 'quota'],
    [429, 'rate_limited', 'rate'],
    [409, 'conflict', 'closed'],
    [404, 'not_found', 'missing'],
    [400, 'invalid_request', 'invalid'],
    [503, 'service_unavailable', 'down'],
  ])('maps %s %s to %s', async (status, code, reason) => {
    const api = createChatApi({ apiUrl: 'https://api.test', fetchImpl: reply(status, { ok: false, error: { code, message: 'x' } }) });
    expect(await api.send(ID, 'hola')).toEqual({ status: 'error', reason });
  });

  it('treats a malformed answer or a network failure as down', async () => {
    const odd = createChatApi({ apiUrl: 'https://api.test', fetchImpl: reply(200, { ok: true, data: { thread: 1 } }) });
    expect(await odd.current()).toEqual({ status: 'error', reason: 'down' });
    const off = createChatApi({ apiUrl: 'https://api.test', fetchImpl: vi.fn().mockRejectedValue(new TypeError('offline')) });
    expect(await off.claim(ID)).toEqual({ status: 'error', reason: 'down' });
  });
});
