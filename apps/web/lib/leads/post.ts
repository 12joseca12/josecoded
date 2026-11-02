import { leadResponseSchema } from '@josecoded/types';

import { env } from '@/lib/env';
import { serverEnv } from '@/lib/env.server';

import type { LeadRequest } from '@josecoded/types';

export type PostLeadResult = { status: 'ok'; leadId: string } | { status: 'invalid' } | { status: 'down' };

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

/**
 * Sends a lead to the gateway (`POST /api/v1/leads`) with the server key, after the web has verified
 * the visitor's Turnstile token itself. A 4xx is the visitor's data (`invalid`); a 5xx, a timeout or
 * no network is the gateway being down (`down`), and the form then offers email and WhatsApp.
 * The visitor's IP (`cf-connecting-ip` as the web saw it) travels in `x-josecoded-client-ip`: the gateway
 * only believes it on a request authenticated with the server key, which is how the lead's rate limit and
 * audit trail see the visitor and not this Worker.
 * Runs on the server only: the key never reaches the browser.
 */
export async function postLead(
  body: LeadRequest,
  options: { clientIp?: string | null; fetchImpl?: Fetch } = {},
): Promise<PostLeadResult> {
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as Fetch);
  const clientIp = options.clientIp?.trim();
  try {
    const response = await fetchImpl(`${env.client.NEXT_PUBLIC_JOSECODED_API_URL.replace(/\/$/, '')}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-josecoded-server-key': serverEnv().SERVER_KEY,
        ...(clientIp ? { 'x-josecoded-client-ip': clientIp } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status >= 500) return { status: 'down' };
    if (!response.ok) return { status: 'invalid' };
    const parsed = leadResponseSchema.safeParse(((await response.json()) as { data?: unknown }).data);
    return parsed.success ? { status: 'ok', leadId: parsed.data.leadId } : { status: 'down' };
  } catch {
    return { status: 'down' };
  }
}
