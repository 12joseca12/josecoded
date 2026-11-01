import { describe, expect, it, vi } from 'vitest';

import { createAffiliatesRepo, createLeadsRepo } from './leads';

import type { RpcClient } from './scheduled-jobs';
import type { CreateLeadPayload } from '../ports';

const payload = { source: 'web_form', idempotency_key: 'k'.repeat(8), meta: {} } as unknown as CreateLeadPayload;

describe('createLeadsRepo', () => {
  it('calls create_lead with the payload as p and maps the row', async () => {
    const rpc = vi.fn(async () => ({ data: [{ lead_id: 'L', contact_id: 'C', created: true }], error: null }));
    const created = await createLeadsRepo({ rpc } as unknown as RpcClient).create(payload);
    expect(rpc).toHaveBeenCalledWith('create_lead', { p: payload });
    expect(created).toEqual({ leadId: 'L', contactId: 'C', created: true });
  });

  it('throws on an RPC error or an empty result', async () => {
    const fails = { rpc: async () => ({ data: null, error: { message: 'boom' } }) } as unknown as RpcClient;
    await expect(createLeadsRepo(fails).create(payload)).rejects.toThrow('create_lead: boom');
    const empty = { rpc: async () => ({ data: [], error: null }) } as unknown as RpcClient;
    await expect(createLeadsRepo(empty).create(payload)).rejects.toThrow('no row');
  });
});

describe('createAffiliatesRepo', () => {
  const client = (row: unknown, error: { message: string } | null = null) =>
    ({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error }) }) }) }),
      auth: { admin: { getUserById: async (id: string) => ({ data: { user: id === 'u1' ? { email: 'a@b.co' } : null }, error: null }) } },
    }) as never;

  it('finds the owner of a code and returns null for an unknown one', async () => {
    expect(await createAffiliatesRepo(() => client({ user_id: 'u1' })).findOwner('ANA-TEST01')).toEqual({ userId: 'u1' });
    expect(await createAffiliatesRepo(() => client(null)).findOwner('ZZZ-000000')).toBeNull();
    await expect(createAffiliatesRepo(() => client(null, { message: 'x' })).findOwner('A')).rejects.toThrow('affiliates: x');
  });

  it('reads the Auth email of a user', async () => {
    const repo = createAffiliatesRepo(() => client(null));
    expect(await repo.userEmail('u1')).toBe('a@b.co');
    expect(await repo.userEmail('u2')).toBeNull();
  });
});
