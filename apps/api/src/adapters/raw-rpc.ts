// RPCs the generated `database.ts` does not know yet (it predates migrations 20261101100000-20261101100700 and is regenerated
// on the Mac with `pnpm --filter @josecoded/types db:types`). Same service-role client as `RpcClient`, but untyped: every
// adapter built on it validates what comes back with zod, so nothing here trusts a shape.
import type { SupabaseGateway } from './supabase';

export interface RawRpc {
  /** Calls `public.<fn>(args)` with the secret key; resolves with the data or throws `<fn>: <message>`. */
  call(fn: string, args?: Record<string, unknown>): Promise<unknown>;
}

export function createRawRpc(gateway: Pick<SupabaseGateway, 'admin'>): RawRpc {
  return {
    async call(fn, args = {}) {
      // the generic client only accepts the names of the generated types; the name is a literal chosen by an adapter
      const { data, error } = await gateway
        .admin()
        .rpc(fn as never, args as never);
      if (error) throw new Error(`${fn}: ${error.message}`);
      return data;
    },
  };
}
