import { describe, expect, it } from 'vitest';

import { signProposalToken, verifyProposalToken, type ProposalTokenPayload } from './proposal-token';
import { hmacSha256, toBase64Url } from '../utils/crypto';

const SECRET = 'server-key-test-0123456789abcdef';
const now = 1_800_000_000;
const payload: ProposalTokenPayload = {
  v: 1,
  id: '3f6c0a52-5a6e-4c1e-9d56-6c7f5a1b2c3d',
  pack: 'P2',
  extras: ['seo_basic'],
  priceFrom: 1400,
  isApp: false,
  pricingVersion: '2026-09-14',
  locale: 'es',
  source: 'rules',
  summary: 'Resumen',
  scope: ['a', 'b', 'c'],
  exp: now + 3600,
};

describe('proposal token', () => {
  it('round-trips a signed payload', async () => {
    const token = await signProposalToken(SECRET, payload);
    expect(await verifyProposalToken(SECRET, token, now)).toEqual(payload);
  });

  it('rejects another key, a changed body, a changed signature and garbage', async () => {
    const token = await signProposalToken(SECRET, payload);
    const [body, signature] = token.split('.') as [string, string];
    const forged = btoa(JSON.stringify({ ...payload, priceFrom: 1 })).replace(/=+$/, '');
    expect(await verifyProposalToken('other-key-other-key-other-key', token, now)).toBeNull();
    expect(await verifyProposalToken(SECRET, `${forged}.${signature}`, now)).toBeNull();
    expect(await verifyProposalToken(SECRET, `${body}.${signature.slice(0, -2)}AA`, now)).toBeNull();
    expect(await verifyProposalToken(SECRET, 'nope', now)).toBeNull();
    expect(await verifyProposalToken(SECRET, `${body}.${signature}.extra`, now)).toBeNull();
    expect(await verifyProposalToken(SECRET, '', now)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signProposalToken(SECRET, { ...payload, exp: now - 1 });
    expect(await verifyProposalToken(SECRET, token, now)).toBeNull();
  });

  it('rejects a signed body that does not match the schema', async () => {
    const token = await signProposalToken(SECRET, { ...payload, pack: 'P9' } as unknown as ProposalTokenPayload);
    expect(await verifyProposalToken(SECRET, token, now)).toBeNull();
  });
});

describe('proposal token: derived key (security review B5)', () => {
  it('a token signed with the raw SERVER_KEY (before the derivation) is rejected', async () => {
    const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const old = `${body}.${await hmacSha256(SECRET, body)}`;
    expect(await verifyProposalToken(SECRET, old, now)).toBeNull();
    expect(await verifyProposalToken(SECRET, await signProposalToken(SECRET, payload), now)).toEqual(payload);
  });
});

