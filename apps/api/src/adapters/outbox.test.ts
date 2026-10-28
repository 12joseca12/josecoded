import { describe, expect, it } from 'vitest';

import { createNoticeLedger, createOutboxRepo } from './outbox';

import type { RpcClient } from './scheduled-jobs';

function fakeClient(replies: Record<string, unknown> = {}, error?: string) {
  const calls: { fn: string; args: unknown }[] = [];
  const client: RpcClient = {
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      // the fake replies with loose JSON; the typed port is checked against the real client in supabase.ts
      return { data: (error ? null : (replies[fn] ?? null)) as never, error: error ? { message: error } : null };
    },
  };
  return { client, calls };
}

describe('createOutboxRepo (signatures of 20261028100000_base.sql)', () => {
  it('claim sends p_limit and p_worker and maps the rows', async () => {
    const { client, calls } = fakeClient({
      outbox_claim: [
        { id: 7, event: 'lead.created', payload: { id: 'l1' }, attempts: 1, created_at: '2026-10-28T10:00:00+00:00' },
        { id: '8', event: 'comment.pending', payload: null, attempts: 3, created_at: '2026-10-28T10:01:00+00:00' },
      ],
    });

    const events = await createOutboxRepo(client).claim(20, 'w1');

    expect(calls).toEqual([{ fn: 'outbox_claim', args: { p_limit: 20, p_worker: 'w1' } }]);
    expect(events).toEqual([
      { id: 7, event: 'lead.created', payload: { id: 'l1' }, attempts: 1, createdAt: new Date('2026-10-28T10:00:00Z') },
      { id: 8, event: 'comment.pending', payload: {}, attempts: 3, createdAt: new Date('2026-10-28T10:01:00Z') },
    ]);
  });

  it('ack sends p_ids and p_worker and returns the count; an empty list makes no call', async () => {
    const { client, calls } = fakeClient({ outbox_ack: 2 });
    const repo = createOutboxRepo(client);
    expect(await repo.ack([], 'w1')).toBe(0);
    expect(calls).toEqual([]);
    expect(await repo.ack([1, 2], 'w1')).toBe(2);
    expect(calls).toEqual([{ fn: 'outbox_ack', args: { p_ids: [1, 2], p_worker: 'w1' } }]);
  });

  it('fail sends p_id, p_worker and p_error and returns the boolean of the RPC', async () => {
    const { client, calls } = fakeClient({ outbox_fail: true });
    expect(await createOutboxRepo(client).fail(3, 'w1', 'telegram 500')).toBe(true);
    expect(calls).toEqual([{ fn: 'outbox_fail', args: { p_id: 3, p_worker: 'w1', p_error: 'telegram 500' } }]);
    expect(await createOutboxRepo(fakeClient({ outbox_fail: false }).client).fail(3, 'w2', 'x')).toBe(false);
  });

  it('turns an RPC error into an exception naming the function', async () => {
    const repo = createOutboxRepo(fakeClient({}, 'permission denied').client);
    await expect(repo.claim(1, 'w')).rejects.toThrow('outbox_claim: permission denied');
  });
});

describe('createNoticeLedger (over increment_quota)', () => {
  it('markSent counts notice:<key> for 7 days; wasSent probes it with limit 1 and a 1-second window', async () => {
    const { client, calls } = fakeClient({ increment_quota: true });
    const ledger = createNoticeLedger(client);
    await ledger.markSent('lead.created:l1');
    expect(await ledger.wasSent('lead.created:l1')).toBe(false);
    expect(calls).toEqual([
      { fn: 'increment_quota', args: { p_key: 'notice:lead.created:l1', p_limit: 1, p_ttl: '7 days' } },
      { fn: 'increment_quota', args: { p_key: 'notice:lead.created:l1', p_limit: 1, p_ttl: '1 second' } },
    ]);
  });

  it('wasSent is true when the RPC says the key is over its limit (someone marked it)', async () => {
    expect(await createNoticeLedger(fakeClient({ increment_quota: false }).client).wasSent('k')).toBe(true);
  });
});
