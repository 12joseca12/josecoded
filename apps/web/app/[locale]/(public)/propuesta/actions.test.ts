// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(async () => true),
  postLead: vi.fn(async () => ({ status: 'ok', leadId: 'x' }) as { status: string; leadId?: string }),
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/turnstile/verify', () => ({ verifyTurnstileToken: mocks.verify }));
vi.mock('@/lib/leads/post', () => ({ postLead: mocks.postLead }));

import { sendProposal } from './actions';

const TOKEN = 'a'.repeat(40);
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ locale: 'en', name: 'Marta', email: 'marta@example.com', proposalToken: TOKEN, pack: 'P2', 'cf-turnstile-response': 'tok', ...fields })) data.set(key, value);
  return data;
};

beforeEach(() => {
  mocks.verify.mockClear().mockResolvedValue(true);
  mocks.postLead.mockClear().mockResolvedValue({ status: 'ok', leadId: 'x' });
});

describe('sendProposal', () => {
  it('sends a web_proposal lead with the signed token, the locale and the proposal_send Turnstile action', async () => {
    const answer = await sendProposal({ status: 'idle' }, form({}));
    expect(answer).toEqual({ status: 'ok', pack: 'P2', hasRef: false });
    expect(mocks.verify).toHaveBeenCalledWith('tok', { ip: '203.0.113.9', action: 'proposal_send' });
    expect(mocks.postLead).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'web_proposal', locale: 'en', proposalToken: TOKEN, contact: { name: 'Marta', email: 'marta@example.com' } }),
      { clientIp: '203.0.113.9' },
    );
  });

  it('answers a field error without reaching the gateway', async () => {
    const answer = await sendProposal({ status: 'idle' }, form({ email: 'bad' }));
    expect(answer).toEqual(expect.objectContaining({ status: 'error', fieldErrors: { email: 'proposal.send.errors.email' } }));
    expect(mocks.postLead).not.toHaveBeenCalled();
  });

  it('says the proposal expired when the token is missing, and offers the fallback when the gateway is down', async () => {
    expect(await sendProposal({ status: 'idle' }, form({ proposalToken: '' }))).toEqual(expect.objectContaining({ status: 'error', formError: 'proposal.send.errors.expired' }));
    mocks.postLead.mockResolvedValue({ status: 'down' });
    expect(await sendProposal({ status: 'idle' }, form({}))).toEqual(expect.objectContaining({ status: 'error', formError: 'proposal.send.errors.down', fallback: true }));
  });

  it('refuses a token that does not verify', async () => {
    mocks.verify.mockResolvedValue(false);
    expect(await sendProposal({ status: 'idle' }, form({}))).toEqual(expect.objectContaining({ status: 'error', formError: 'proposal.send.errors.captcha' }));
    expect(mocks.postLead).not.toHaveBeenCalled();
  });
});
