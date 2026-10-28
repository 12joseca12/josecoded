// Real adapter of the ScheduledJobsRepo port (working-agreements §17.1) over `private.scheduled_jobs`.
// PostgREST does not expose the `private` schema, so it goes through the three service-role-only RPCs of
// migration 20260930100100_scheduled_jobs.sql.
import { createClient } from '@supabase/supabase-js';

import type { Env } from '../types/env.types';
import type { ScheduledJob, ScheduledJobsRepo } from '@josecoded/types';

/** The slice of the supabase-js client the adapter needs (also what the tests fake). */
export interface RpcClient {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

type DueRow = { name: string; cron: string; tz: string | null; next_run_at: string };

async function call(client: RpcClient, fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
}

export function createScheduledJobsRepo(client: RpcClient): ScheduledJobsRepo {
  return {
    async listDue(now) {
      const rows = (await call(client, 'scheduled_jobs_due', { p_now: now.toISOString() })) as DueRow[] | null;
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
      await call(client, 'scheduled_jobs_mark_ran', {
        p_name: name,
        p_ran_at: ranAt.toISOString(),
        p_next_run_at: nextRunAt.toISOString(),
      });
    },
    async disable(name, reason) {
      await call(client, 'scheduled_jobs_disable', { p_name: name, p_reason: reason });
    },
  };
}

/** Undefined without the service role key: the dispatcher then finds nothing to run (see Deps.scheduledJobs). */
export function createScheduledJobsRepoFromEnv(env: Env): ScheduledJobsRepo | undefined {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return undefined;
  const client = createClient(env.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return createScheduledJobsRepo({ rpc: (fn, args) => client.rpc(fn, args) });
}
