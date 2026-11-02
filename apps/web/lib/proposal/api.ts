import type { ProposalRequest, ProposalResponse } from '@josecoded/types';

export type GenerateResult =
  | { status: 'ok'; proposal: ProposalResponse }
  | { status: 'error'; reason: 'captcha' | 'rate' | 'quota' | 'down' | 'invalid' };

/**
 * `POST /api/v1/proposals/generate` straight from the browser (the gateway allows the site's origin and
 * checks Turnstile, the rate and the daily quota). The price in the answer was set by the gateway from
 * the price list, never by the model. Types only: zod is not shipped to the browser for this.
 */
export async function generateProposal(
  apiUrl: string,
  request: ProposalRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<GenerateResult> {
  try {
    const response = await fetchImpl(`${apiUrl.replace(/\/$/, '')}/api/v1/proposals/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (response.status === 429) return { status: 'error', reason: 'rate' };
    if (response.status === 403) return { status: 'error', reason: 'captcha' };
    if (response.status === 400) return { status: 'error', reason: 'invalid' };
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
      return { status: 'error', reason: body?.error?.code === 'quota_exceeded' ? 'quota' : 'down' };
    }
    const body = (await response.json()) as { data?: ProposalResponse };
    return body.data?.pack ? { status: 'ok', proposal: body.data } : { status: 'error', reason: 'down' };
  } catch {
    return { status: 'error', reason: 'down' };
  }
}

/** The `?pack=` of `/servicios` (P1–P5) as the gateway names it. */
export function preselectedPackOf(code: string | null | undefined): ProposalRequest['preselectedPack'] {
  const wanted = code?.toUpperCase();
  if (wanted === 'P5') return 'APP_MVP';
  return wanted === 'P1' || wanted === 'P2' || wanted === 'P3' || wanted === 'P4' ? wanted : undefined;
}

/** «1.400 €» / «€1,400»: the same writing as `formatPrice` of the price package, which is not imported to keep the price list out of this bundle. */
export function formatEuros(amount: number, locale: 'es' | 'en'): string {
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'es' ? '.' : ',');
  return locale === 'es' ? `${grouped} €` : `€${grouped}`;
}
