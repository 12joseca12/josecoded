import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com' } } }));
vi.mock('@/lib/env.server', () => ({ serverEnv: () => ({ TURNSTILE_SECRET_KEY: 'secret' }) }));

import { verifyTurnstileToken } from './verify';

const fetchMock = vi.fn();
beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const ok = (body: object) => ({ ok: true, json: async () => body });

it('refuses an empty token without calling Cloudflare', async () => {
  expect(await verifyTurnstileToken('')).toBe(false);
  expect(await verifyTurnstileToken(null)).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('posts secret, token and ip, and accepts a successful answer', async () => {
  fetchMock.mockResolvedValue(ok({ success: true, action: 'login', hostname: 'josecoded.com' }));
  expect(await verifyTurnstileToken('tok', { ip: '1.2.3.4', action: 'login' })).toBe(true);
  const [url, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
  expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  expect(init.body.get('secret')).toBe('secret');
  expect(init.body.get('response')).toBe('tok');
  expect(init.body.get('remoteip')).toBe('1.2.3.4');
});

it('refuses a token minted for another action', async () => {
  fetchMock.mockResolvedValue(ok({ success: true, action: 'comment', hostname: 'josecoded.com' }));
  expect(await verifyTurnstileToken('tok', { action: 'login' })).toBe(false);
});

it('fails closed on a rejected token, an HTTP error and a network error', async () => {
  fetchMock.mockResolvedValueOnce(ok({ success: false }));
  expect(await verifyTurnstileToken('tok')).toBe(false);
  fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
  expect(await verifyTurnstileToken('tok')).toBe(false);
  fetchMock.mockRejectedValueOnce(new Error('offline'));
  expect(await verifyTurnstileToken('tok')).toBe(false);
});

it('refuses a token solved on another hostname', async () => {
  fetchMock.mockResolvedValue(ok({ success: true, action: 'login', hostname: 'evil.example' }));
  expect(await verifyTurnstileToken('tok', { action: 'login' })).toBe(false);
});
