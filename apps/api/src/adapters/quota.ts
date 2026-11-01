// Real adapter of the QuotaStore port over `public.increment_quota` (atomic, service role; migration 20261028100000).
import { callRpc, type RpcClient } from './scheduled-jobs';

import type { QuotaStore } from '../ports';

export function createQuotaStore(client: RpcClient): QuotaStore {
  return {
    async hit(key, limit, ttlSeconds) {
      const within = await callRpc(client, 'increment_quota', {
        p_key: key,
        p_limit: limit,
        p_ttl: `${Math.max(1, Math.floor(ttlSeconds))} seconds`,
      });
      return within === true;
    },
  };
}
