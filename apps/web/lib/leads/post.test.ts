// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { client: { NEXT_PUBLIC_JOSECODED_API_URL: 'http://localhost:8787/' }, server: { SERVER_KEY: 'k' } },
}));

import { postLead } from './post';

import type { LeadRequest } from '@josecoded/types';

const body = { source: 'web_form', locale: 'es', idempotencyKey: 'x', contact: { name: 'a', email: 'a@b.co' } } as LeadRequest;
const answer = (status: number, json: unknown = {}) => async () => ({ ok: status < 400, status, json: async () => json });

describe('postLead', () => {
  it('sends the server key to /api/v1/leads and reads the lead id', async () => {
    const fetchImpl = vi.fn(answer(201, { ok: true, data: { leadId: 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b', notified: 'outbox' } }));
    expect(await postLead(body, fetchImpl)).toEqual({ status: 'ok', leadId: 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe('http://localhost:8787/api/v1/leads');
    expect(init.headers['x-josecoded-server-key']).toBe('k');
  });

  it('tells the visitor data (4xx) from the gateway being down (5xx, network)', async () => {
    expect(await postLead(body, answer(400))).toEqual({ status: 'invalid' });
    expect(await postLead(body, answer(503))).toEqual({ status: 'down' });
    expect(await postLead(body, async () => { throw new Error('offline'); })).toEqual({ status: 'down' });
  });
});
