import { describe, expect, it } from 'vitest';

import { buildCsp, cspConfigFromEnv, inlineScripts, scriptHashes } from './csp';

import type { CspConfig } from './csp';

const config: CspConfig = {
  apiOrigin: 'https://api.josecoded.com',
  supabaseOrigin: 'https://abc.supabase.co',
  umamiOrigin: 'https://stats.josecoded.com',
  cloudflareBeacon: false,
  https: true,
};

const page = `<html><head><script>try{var a=1}catch(e){}</script><script src="/_next/static/chunks/a.js" async></script></head>
<body><script type="application/ld+json">{"@context":"https://schema.org"}</script><script>self.__next_f.push([1,"x"])</script><script></script></body></html>`;

describe('inlineScripts', () => {
  it('returns the inline code only: no src, no data blocks, no empty ones', () => {
    expect(inlineScripts(page)).toEqual(['try{var a=1}catch(e){}', 'self.__next_f.push([1,"x"])']);
  });
});

describe('scriptHashes', () => {
  it('hashes the exact text with SHA-256 (known vector) and deduplicates', async () => {
    // sha256("alert(1)") base64
    expect(await scriptHashes('<script>alert(1)</script><script>alert(1)</script>')).toEqual([
      "'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='",
    ]);
  });
});

describe('buildCsp', () => {
  const csp = buildCsp(["'sha256-AAA='"], config);
  const directive = (name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `) || d === name);

  it('script-src is self plus the page hashes: no unsafe-inline, no unsafe-eval', () => {
    expect(directive('script-src')).toContain("'self' 'sha256-AAA='");
    expect(directive('script-src')).not.toMatch(/unsafe/);
    expect(csp).not.toContain('unsafe-eval');
  });

  it('forbids framing, plugins and foreign bases and forms', () => {
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive('object-src')).toBe("object-src 'none'");
    expect(directive('base-uri')).toBe("base-uri 'self'");
    expect(directive('form-action')).toBe("form-action 'self'");
  });

  it('allows the gateway, Supabase (REST and realtime) and Umami for fetches, and Turnstile and Cal.com in frames', () => {
    expect(directive('connect-src')).toBe(
      "connect-src 'self' https://api.josecoded.com https://abc.supabase.co wss://abc.supabase.co https://stats.josecoded.com",
    );
    expect(directive('frame-src')).toContain('https://challenges.cloudflare.com');
    expect(directive('frame-src')).toContain('https://app.cal.com');
    expect(directive('script-src')).toContain('https://stats.josecoded.com');
  });

  it('upgrades insecure requests only for an https site', () => {
    expect(csp).toContain('upgrade-insecure-requests');
    expect(buildCsp([], { ...config, https: false })).not.toContain('upgrade-insecure-requests');
  });

  it('leaves Umami and the Cloudflare beacon out when they are not configured', () => {
    const bare = buildCsp([], { ...config, umamiOrigin: undefined });
    expect(bare).not.toContain('stats.josecoded.com');
    expect(bare).not.toContain('cloudflareinsights');
    expect(buildCsp([], { ...config, cloudflareBeacon: true })).toContain('https://static.cloudflareinsights.com');
  });
});

describe('cspConfigFromEnv', () => {
  it('takes origins (not paths) and needs both Umami variables', () => {
    const base = {
      NEXT_PUBLIC_SITE_URL: 'https://josecoded.com',
      NEXT_PUBLIC_JOSECODED_API_URL: 'https://api.josecoded.com/api/v1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    };
    expect(cspConfigFromEnv({ ...base, NEXT_PUBLIC_UMAMI_URL: 'https://stats.josecoded.com/x' })).toMatchObject({
      apiOrigin: 'https://api.josecoded.com',
      https: true,
      umamiOrigin: undefined,
    });
    expect(
      cspConfigFromEnv({ ...base, NEXT_PUBLIC_UMAMI_URL: 'https://stats.josecoded.com/x', NEXT_PUBLIC_UMAMI_WEBSITE_ID: 'id' }).umamiOrigin,
    ).toBe('https://stats.josecoded.com');
    expect(cspConfigFromEnv({ ...base, NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }).https).toBe(false);
  });
});
