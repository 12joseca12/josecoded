import { describe, expect, it, vi } from 'vitest';

import { createTurnstileVerifier, hostnameAllowed } from './turnstile';

import type { Env } from '../types/env.types';

const env = (over: Partial<Env> = {}): Env => ({
  API_MODE: 'production',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  TURNSTILE_SECRET_KEY: '0x4AAAAAAA-secret',
  ALLOWED_TURNSTILE_HOSTNAMES: 'josecoded.com,www.josecoded.com,*-josecoded-web.jose.workers.dev',
  ...over,
});
const answer = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('hostnameAllowed', () => {
  it('matches exact hosts and star suffixes only', () => {
    const list = 'josecoded.com,*-josecoded-web.jose.workers.dev';
    expect(hostnameAllowed('josecoded.com', list)).toBe(true);
    expect(hostnameAllowed('JOSECODED.com', list)).toBe(true);
    expect(hostnameAllowed('abc-josecoded-web.jose.workers.dev', list)).toBe(true);
    expect(hostnameAllowed('evil-josecoded.com', list)).toBe(false);
    expect(hostnameAllowed('josecoded.com.evil.com', list)).toBe(false);
    expect(hostnameAllowed('-josecoded-web.jose.workers.dev', list)).toBe(false);
  });
});

describe('createTurnstileVerifier', () => {
  it('is undefined without a secret', () => {
    expect(createTurnstileVerifier(env({ TURNSTILE_SECRET_KEY: undefined }))).toBeUndefined();
  });

  it('posts the secret, token and ip, and accepts action and hostname that match', async () => {
    const fetchMock = answer({ success: true, action: 'proposal', hostname: 'josecoded.com' });
    const verifier = createTurnstileVerifier(env(), fetchMock as unknown as typeof fetch)!;
    expect(await verifier.verify('tok', '9.9.9.9', ['proposal'])).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const form = init.body as URLSearchParams;
    expect(form.get('secret')).toBe('0x4AAAAAAA-secret');
    expect(form.get('response')).toBe('tok');
    expect(form.get('remoteip')).toBe('9.9.9.9');
  });

  it('refuses success false, a wrong action and a wrong hostname', async () => {
    const run = (body: unknown) =>
      createTurnstileVerifier(env(), answer(body) as unknown as typeof fetch)!.verify('t', '1.1.1.1', ['proposal', 'contact']);
    expect(await run({ success: false })).toBe('failed');
    expect(await run({ success: true, action: 'chat', hostname: 'josecoded.com' })).toBe('failed');
    expect(await run({ success: true, hostname: 'josecoded.com' })).toBe('failed');
    expect(await run({ success: true, action: 'contact', hostname: 'evil.com' })).toBe('failed');
    expect(await run({ success: true, action: 'contact' })).toBe('failed');
    expect(await run({ success: true, action: 'contact', hostname: 'www.josecoded.com' })).toBe('ok');
  });

  it('has no verdict when Cloudflare is unreachable, answers an error status or returns garbage', async () => {
    const down = vi.fn(async () => {
      throw new Error('network');
    });
    expect(await createTurnstileVerifier(env(), down as unknown as typeof fetch)!.verify('t', '1.1.1.1', ['proposal'])).toBe('unavailable');
    expect(await createTurnstileVerifier(env(), answer({}, 500) as unknown as typeof fetch)!.verify('t', '1.1.1.1', ['proposal'])).toBe('unavailable');
    const garbage = vi.fn(async () => new Response('<html>', { status: 200 }));
    expect(await createTurnstileVerifier(env(), garbage as unknown as typeof fetch)!.verify('t', '1.1.1.1', ['proposal'])).toBe('unavailable');
  });

  it('in production a missing hostname list is "unavailable", in development any hostname passes', async () => {
    const body = { success: true, action: 'proposal', hostname: 'anything.test' };
    const prod = createTurnstileVerifier(env({ ALLOWED_TURNSTILE_HOSTNAMES: undefined }), answer(body) as unknown as typeof fetch)!;
    expect(await prod.verify('t', '1.1.1.1', ['proposal'])).toBe('unavailable');
    const dev = createTurnstileVerifier(env({ API_MODE: 'development', ALLOWED_TURNSTILE_HOSTNAMES: undefined }), answer(body) as unknown as typeof fetch)!;
    expect(await dev.verify('t', '1.1.1.1', ['proposal'])).toBe('ok');
  });
});
