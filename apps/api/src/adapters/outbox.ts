// Real adapters of the OutboxRepo and NoticeLedger ports over the service-role RPCs of migration
// 20261028100000_base.sql (`private` is not exposed by PostgREST). Signatures as implemented there:
//   outbox_claim(p_limit integer, p_worker text) -> table(id bigint, event text, payload jsonb, attempts smallint,
//                                                           created_at timestamptz)
//   outbox_ack(p_ids bigint[], p_worker text) -> integer
//   outbox_fail(p_id bigint, p_worker text, p_error text) -> boolean
// Dead-lettering (10 attempts -> dead_at + system.outbox_dead) happens in SQL, not here.
import { callRpc, type RpcClient } from './scheduled-jobs';

import type { Json, NoticeLedger, OutboxEvent, OutboxRepo } from '@josecoded/types';

/** `outbox.payload` is jsonb; the gateway only handles objects, anything else counts as empty. */
function payloadOf(value: Json): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createOutboxRepo(client: RpcClient): OutboxRepo {
  return {
    async claim(limit, worker) {
      const rows = await callRpc(client, 'outbox_claim', { p_limit: limit, p_worker: worker });
      return (rows ?? []).map(
        (row): OutboxEvent => ({
          // bigserial: PostgREST sends it as a JSON number while it fits (it always will here)
          id: Number(row.id),
          event: row.event,
          payload: payloadOf(row.payload),
          attempts: row.attempts,
          createdAt: new Date(row.created_at),
        }),
      );
    },
    async ack(ids, worker) {
      if (ids.length === 0) return 0;
      const changed = await callRpc(client, 'outbox_ack', { p_ids: ids, p_worker: worker });
      return typeof changed === 'number' ? changed : 0;
    },
    async fail(id, worker, error) {
      return (await callRpc(client, 'outbox_fail', { p_id: id, p_worker: worker, p_error: error })) === true;
    },
  };
}

/** How long a "sent" mark lives: far longer than the outbox keeps retrying an event (10 attempts). */
const SENT_TTL = '7 days';
/**
 * A probe that finds no mark leaves a counter that expires almost at once, so it does not count as "sent" for
 * the retry of an event whose delivery fails after the probe.
 */
const PROBE_TTL = '1 second';

/**
 * NoticeLedger over `public.increment_quota(p_key, p_limit, p_ttl)` (`private.quota_counters`), so it needs no
 * table of its own. `markSent` counts the key for 7 days; `wasSent` counts it with limit 1: `false` back from the
 * RPC means the key already had a live count, i.e. someone marked it. Keys are namespaced `notice:`.
 */
export function createNoticeLedger(client: RpcClient): NoticeLedger {
  const key = (k: string) => `notice:${k}`;
  return {
    async markSent(k) {
      await callRpc(client, 'increment_quota', { p_key: key(k), p_limit: 1, p_ttl: SENT_TTL });
    },
    async wasSent(k) {
      const withinLimit = await callRpc(client, 'increment_quota', { p_key: key(k), p_limit: 1, p_ttl: PROBE_TTL });
      return withinLimit === false;
    },
  };
}
