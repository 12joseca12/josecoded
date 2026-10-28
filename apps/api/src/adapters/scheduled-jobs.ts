// Real adapter of the ScheduledJobsRepo port (working-agreements §17.1) over `private.scheduled_jobs`.
// PostgREST does not expose the `private` schema, so it goes through the three service-role-only RPCs of
// migration 20261028100000_base.sql. The service-role client comes from adapters/supabase.ts (one per request).
import type { Database, ScheduledJob, ScheduledJobsRepo } from '@josecoded/types';

type PublicFunctions = Database['public']['Functions'];
/** Names of the RPCs the generated `database.ts` knows. */
export type RpcName = keyof PublicFunctions;
export type RpcArgs<F extends RpcName> = PublicFunctions[F]['Args'];
export type RpcReturns<F extends RpcName> = PublicFunctions[F]['Returns'];

/** The slice of the supabase-js client the RPC adapters need (also what the tests fake), typed from `Database`. */
export interface RpcClient {
  rpc<F extends RpcName>(
    fn: F,
    args: RpcArgs<F>,
  ): PromiseLike<{ data: RpcReturns<F> | null; error: { message: string } | null }>;
}

/** Calls `fn` and turns a PostgREST error into an exception naming the function. */
export async function callRpc<F extends RpcName>(
  client: RpcClient,
  fn: F,
  args: RpcArgs<F>,
): Promise<RpcReturns<F> | null> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
}

export function createScheduledJobsRepo(client: RpcClient): ScheduledJobsRepo {
  return {
    async listDue(now) {
      const rows = await callRpc(client, 'scheduled_jobs_due', { p_now: now.toISOString() });
      return (rows ?? []).map(
        (row): ScheduledJob => ({
          name: row.name,
          cron: row.cron,
          ...(row.tz ? { tz: row.tz } : {}),
          nextRunAt: new Date(row.next_run_at),
        }),
      );
    },
    async markRan(name, ranAt, nextRunAt) {
      await callRpc(client, 'scheduled_jobs_mark_ran', {
        p_name: name,
        p_ran_at: ranAt.toISOString(),
        p_next_run_at: nextRunAt.toISOString(),
      });
    },
    async disable(name, reason) {
      await callRpc(client, 'scheduled_jobs_disable', { p_name: name, p_reason: reason });
    },
  };
}
