import { afterEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ token: 'tok' as string | null }));

vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_JOSECODED_API_URL: 'https://api.test' } } }));
vi.mock('../supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getSession: async () => ({ data: { session: state.token ? { access_token: state.token } : null } }) },
  }),
}));

import { adminFetch } from './gateway';

afterEach(() => {
  vi.restoreAllMocks();
  state.token = 'tok';
});

it('adds the admin JWT and hits the gateway base URL', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true,"data":{}}'));
  await adminFetch('/api/v1/system/status');
  expect(spy.mock.calls[0]?.[0]).toBe('https://api.test/api/v1/system/status');
  expect((spy.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
});

it('keeps the headers and the method of the caller, and never caches', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  await adminFetch('/api/v1/x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const init = spy.mock.calls[0]?.[1] as RequestInit;
  expect(init.method).toBe('POST');
  expect(init.cache).toBe('no-store');
  expect(init.headers).toMatchObject({ 'content-type': 'application/json', Authorization: 'Bearer tok' });
});

it('never lets the caller replace the Authorization header', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  await adminFetch('/api/v1/x', { headers: { authorization: 'Bearer other' } });
  const headers = (spy.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
  expect(headers.Authorization).toBe('Bearer tok');
  expect(Object.keys(headers).filter((name) => name.toLowerCase() === 'authorization')).toEqual(['Authorization']);
});

it('does not call the gateway without a session', async () => {
  state.token = null;
  const spy = vi.spyOn(globalThis, 'fetch');
  await expect(adminFetch('/api/v1/system/status')).rejects.toThrow('no session');
  expect(spy).not.toHaveBeenCalled();
});

it('refuses a path that is not an absolute path of the gateway', async () => {
  const spy = vi.spyOn(globalThis, 'fetch');
  await expect(adminFetch('//evil.example/x')).rejects.toThrow();
  await expect(adminFetch('https://evil.example/x')).rejects.toThrow();
  expect(spy).not.toHaveBeenCalled();
});
