import { describe, expect, it } from 'vitest';

import { createScheduledJobsRepo, createScheduledJobsRepoFromEnv, type RpcClient } from './scheduled-jobs';

import type { Env } from '../types/env.types';

function fakeClient(reply: { data?: unknown; error?: { message: string } | null } = {}) {
  const calls: { fn: string; args: Record<string, unknown> | undefined }[] = [];
  const client: RpcClient = {
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      return { data: reply.data ?? null, error: reply.error ?? null };
    },
  };
  return { client, calls };
}

describe('createScheduledJobsRepo', () => {
  it('listDue maps rows to jobs and leaves tz out when null', async () => {
    const { client, calls } = fakeClient({
      data: [
        { name: 'radar.daily', cron: '0 8 * * *', tz: 'Europe/Madrid', next_run_at: '2026-10-28T06:00:00.000Z' },
        { name: 'radar.sweep', cron: '*/5 * * * *', tz: null, next_run_at: '2026-10-28T05:55:00.000Z' },
      ],
    });
    const now = new Date('2026-10-28T06:00:00.000Z');

    const jobs = await createScheduledJobsRepo(client).listDue(now);

    expect(calls).toEqual([{ fn: 'scheduled_jobs_due', args: { p_now: now.toISOString() } }]);
    expect(jobs).toEqual([
      { name: 'radar.daily', cron: '0 8 * * *', tz: 'Europe/Madrid', nextRunAt: new Date('2026-10-28T06:00:00.000Z') },
      { name: 'radar.sweep', cron: '*/5 * * * *', nextRunAt: new Date('2026-10-28T05:55:00.000Z') },
    ]);
    expect(Object.keys(jobs[1] ?? {})).not.toContain('tz');
  });

  it('listDue returns an empty list when the RPC returns null', async () => {
    expect(await createScheduledJobsRepo(fakeClient().client).listDue(new Date())).toEqual([]);
  });

  it('markRan sends the run and the next run', async () => {
    const { client, calls } = fakeClient();
    await createScheduledJobsRepo(client).markRan(
      'radar.sweep',
      new Date('2026-10-28T06:00:00.000Z'),
      new Date('2026-10-28T06:05:00.000Z'),
    );
    expect(calls).toEqual([
      {
        fn: 'scheduled_jobs_mark_ran',
        args: { p_name: 'radar.sweep', p_ran_at: '2026-10-28T06:00:00.000Z', p_next_run_at: '2026-10-28T06:05:00.000Z' },
      },
    ]);
  });

  it('disable(name, reason) sends both to the RPC that sets enabled = false', async () => {
    const { client, calls } = fakeClient();
    await createScheduledJobsRepo(client).disable('typo.tz', 'invalid time zone');
    expect(calls).toEqual([
      { fn: 'scheduled_jobs_disable', args: { p_name: 'typo.tz', p_reason: 'invalid time zone' } },
    ]);
  });

  it('turns an RPC error into an exception naming the function', async () => {
    const repo = createScheduledJobsRepo(fakeClient({ error: { message: 'permission denied' } }).client);
    await expect(repo.disable('x', 'y')).rejects.toThrow('scheduled_jobs_disable: permission denied');
    await expect(repo.listDue(new Date())).rejects.toThrow('scheduled_jobs_due: permission denied');
  });
});

describe('createScheduledJobsRepoFromEnv', () => {
  const env = {
    API_MODE: 'development',
    WORKER_URL: 'http://worker.test',
    WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
    CORS_ORIGINS: '',
    SUPABASE_URL: 'http://127.0.0.1:54321',
  } satisfies Env;

  it('is undefined without the service role key', () => {
    expect(createScheduledJobsRepoFromEnv(env)).toBeUndefined();
    expect(createScheduledJobsRepoFromEnv({ ...env, SUPABASE_SERVICE_ROLE_KEY: '  ' })).toBeUndefined();
  });

  it('builds the repo with the key', () => {
    const repo = createScheduledJobsRepoFromEnv({ ...env, SUPABASE_SERVICE_ROLE_KEY: 'a'.repeat(30) });
    expect(repo).toBeDefined();
  });
});
