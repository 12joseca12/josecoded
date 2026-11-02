import { buildCsp, scriptHashes } from './csp';

import type { CspConfig } from './csp';

/**
 * The worker's last step: HTML responses get a Content-Security-Policy whose script hashes are those of their own inline
 * scripts. Anything else (RSC payloads, JSON, redirects, assets) passes through untouched. The body is read whole: pages
 * are prerendered or small, and the policy has to be in the headers before the first byte.
 */
export async function withCsp(response: Response, config: CspConfig): Promise<Response> {
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html') || response.body === null) return response;
  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', buildCsp(await scriptHashes(html), config));
  // the length changes with nothing here, but a stale one would truncate or hang the response
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
