// Content-Security-Policy by hash (SEO/GEO analysis §5.1, decision of the arquitecto: hash, not nonce). A nonce would force
// a dynamic render on every request and lose the static pages and their cache; a hash lets every page stay prerendered.
//
// What is hashed: the inline scripts of the response itself. Besides the two gates (`intro-gate-script`, `hero-mode-script`)
// Next inlines its RSC payload (`self.__next_f.push(...)`, different on every page), so the hashes cannot be a build-time
// constant: `with-csp.ts` hashes the inline scripts of each HTML response in the worker (SHA-256 of ~60 KB, well under
// a millisecond) and sends exactly those. No `unsafe-inline`, no `unsafe-eval`, no `strict-dynamic`: every other script is
// a same-origin file. JSON-LD (`application/ld+json`) is data, not code, and needs no hash.
//
// Origins come from the public environment of the build (`scripts/csp-config.ts` writes them to a JSON the worker imports).

export interface CspConfig {
  /** Gateway origin (`NEXT_PUBLIC_JOSECODED_API_URL`). */
  apiOrigin?: string;
  /** Supabase origin (`NEXT_PUBLIC_SUPABASE_URL`): REST, auth and realtime (wss). */
  supabaseOrigin?: string;
  /** Self-hosted Umami origin, when configured. */
  umamiOrigin?: string;
  /** Cloudflare Web Analytics beacon, when configured. */
  cloudflareBeacon: boolean;
  /** Only an https site may ask the browser to upgrade requests: on http (local preview, CI) it would break every asset. */
  https: boolean;
}

const sha256Base64 = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

/** Types that are data blocks: the browser never runs them, so the CSP does not apply. */
const DATA_TYPE = /\btype\s*=\s*["']?(?:application\/(?:ld\+)?json|importmap|speculationrules)/i;

/** The text of every inline `<script>` that runs code (no `src`, not a data block), in document order. */
export function inlineScripts(html: string): string[] {
  const found: string[] = [];
  for (const [, attributes = '', body = ''] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attributes) || DATA_TYPE.test(attributes) || body === '') continue;
    found.push(body);
  }
  return found;
}

/** `'sha256-…'` sources for the inline scripts of a document, deduplicated. */
export async function scriptHashes(html: string): Promise<string[]> {
  const hashes = await Promise.all(inlineScripts(html).map(sha256Base64));
  return [...new Set(hashes)].map((hash) => `'sha256-${hash}'`);
}

const wss = (origin: string) => origin.replace(/^http/, 'ws');

export function buildCsp(hashes: readonly string[], config: CspConfig): string {
  const turnstile = 'https://challenges.cloudflare.com';
  const cal = ['https://app.cal.com', 'https://cal.com'];
  const scriptSrc = ["'self'", ...hashes, turnstile, ...(config.umamiOrigin ? [config.umamiOrigin] : []), ...(config.cloudflareBeacon ? ['https://static.cloudflareinsights.com'] : [])];
  const connectSrc = [
    "'self'",
    ...(config.apiOrigin ? [config.apiOrigin] : []),
    ...(config.supabaseOrigin ? [config.supabaseOrigin, wss(config.supabaseOrigin)] : []),
    ...(config.umamiOrigin ? [config.umamiOrigin] : []),
    ...(config.cloudflareBeacon ? ['https://cloudflareinsights.com'] : []),
  ];
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', scriptSrc],
    // `style` attributes come from React `style` props (custom properties such as `--span`); stylesheets are files
    ['style-src', ["'self'"]],
    ['style-src-attr', ["'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:', ...(config.supabaseOrigin ? [config.supabaseOrigin] : [])]],
    ['font-src', ["'self'"]],
    ['media-src', ["'self'", 'blob:']],
    ['connect-src', connectSrc],
    ['frame-src', [turnstile, ...cal]],
    ['worker-src', ["'self'", 'blob:']],
    ['manifest-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
    ...(config.https ? ([['upgrade-insecure-requests', []]] as [string, string[]][]) : []),
  ];
  return directives.map(([name, sources]) => [name, ...new Set(sources)].join(' ')).join('; ');
}

/** Origins of a build from its public environment. */
export function cspConfigFromEnv(env: Record<string, string | undefined>): CspConfig {
  const origin = (url: string | undefined) => (url ? new URL(url).origin : undefined);
  const site = env.NEXT_PUBLIC_SITE_URL ?? '';
  return {
    apiOrigin: origin(env.NEXT_PUBLIC_JOSECODED_API_URL),
    supabaseOrigin: origin(env.NEXT_PUBLIC_SUPABASE_URL),
    umamiOrigin: env.NEXT_PUBLIC_UMAMI_URL && env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? origin(env.NEXT_PUBLIC_UMAMI_URL) : undefined,
    cloudflareBeacon: Boolean(env.NEXT_PUBLIC_CF_BEACON_TOKEN),
    https: site.startsWith('https://'),
  };
}
