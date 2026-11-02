import { describe, expect, it } from 'vitest';

import { withCsp } from './with-csp';

import type { CspConfig } from './csp';

const config: CspConfig = { apiOrigin: 'http://localhost:8787', supabaseOrigin: 'http://127.0.0.1:54321', cloudflareBeacon: false, https: false };
const html = (init: ResponseInit = {}) =>
  new Response('<html><script>self.__next_f.push([0])</script></html>', {
    ...init,
    headers: { 'content-type': 'text/html; charset=utf-8', 'content-length': '999', ...init.headers },
  });

describe('withCsp', () => {
  it('adds the hash of the response own inline scripts and keeps status and body', async () => {
    const response = await withCsp(html({ status: 404 }), config);
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('__next_f');
    expect(response.headers.get('content-security-policy')).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
    expect(response.headers.has('content-length')).toBe(false);
  });

  it('leaves RSC payloads, JSON and bodiless responses alone', async () => {
    const rsc = new Response('0:[]', { headers: { 'content-type': 'text/x-component' } });
    expect(await withCsp(rsc, config)).toBe(rsc);
    const redirect = new Response(null, { status: 308, headers: { location: '/x' } });
    expect(await withCsp(redirect, config)).toBe(redirect);
  });
});
