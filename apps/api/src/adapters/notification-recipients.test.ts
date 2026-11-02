import { describe, expect, it } from 'vitest';

import { createRecipientsRepo } from './notification-recipients';

import type { RawRpc } from './raw-rpc';

const rpc = (rows: unknown): RawRpc => ({ call: async () => rows }) as unknown as RawRpc;

describe('createRecipientsRepo', () => {
  it('an admin rule without a linked chat comes back as the admin chat; a client row does not', async () => {
    const repo = createRecipientsRepo(
      rpc([
        { channel: 'telegram', address: '1000', admin_fallback: false },
        { channel: 'telegram', address: null, admin_fallback: true },
        { channel: 'telegram', address: null, admin_fallback: false },
        { channel: 'email', address: null },
      ]),
    );
    expect(await repo.forEvent('lead.created', null)).toEqual([
      { channel: 'telegram', address: '1000' },
      { channel: 'telegram', address: null, adminChat: true },
      { channel: 'telegram', address: null },
      { channel: 'email', address: null },
    ]);
  });
});
