import { describe, expect, it, vi } from 'vitest';

import { formatEuros, generateProposal, preselectedPackOf } from './api';

import type { ProposalRequest } from '@josecoded/types';

const request = { locale: 'es', turnstileToken: 't', answers: { businessType: 'x', needs: 'y', salesMode: 'none', timeline: 'flexible' } } as ProposalRequest;
const reply = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('generateProposal', () => {
  it('returns the proposal of the gateway envelope', async () => {
    const proposal = { pack: { code: 'P2' }, priceFrom: 1400 };
    expect(await generateProposal('http://x/', request, reply(200, { ok: true, data: proposal }))).toEqual({ status: 'ok', proposal });
  });

  it('maps the gateway failures to the reasons the page can word', async () => {
    expect(await generateProposal('http://x', request, reply(429))).toEqual({ status: 'error', reason: 'rate' });
    expect(await generateProposal('http://x', request, reply(403))).toEqual({ status: 'error', reason: 'captcha' });
    expect(await generateProposal('http://x', request, reply(502, { error: { code: 'upstream_error' } }))).toEqual({ status: 'error', reason: 'down' });
    expect(await generateProposal('http://x', request, reply(429 + 0, {}))).toEqual({ status: 'error', reason: 'rate' });
    expect(await generateProposal('http://x', request, vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toEqual({ status: 'error', reason: 'down' });
  });
});

describe('helpers', () => {
  it('maps the pack of the services page and writes prices like the price package', () => {
    expect(preselectedPackOf('p2')).toBe('P2');
    expect(preselectedPackOf('P5')).toBe('APP_MVP');
    expect(preselectedPackOf('zz')).toBeUndefined();
    expect(formatEuros(1400, 'es')).toBe('1.400 €');
    expect(formatEuros(1400, 'en')).toBe('€1,400');
  });
});
