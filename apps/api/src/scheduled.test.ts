import { afterEach, describe, expect, it, vi } from 'vitest';

import { jobHandlers, runDueJobs, scheduled, type JobHandler } from './scheduled';
import { createFakeClock } from '../test/fakes/clock.fake';
import { createFakeScheduledJobs } from '../test/fakes/scheduled-jobs.fake';


import type { Deps } from './deps';
import type { Env } from './types/env.types';
import type { ScheduledJob } from '@josecoded/types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
} satisfies Env;

const NOW = '2026-05-04T10:02:30.000Z';
const due = (name: string, minutesAgo: number, cron = '*/5 * * * *', tz?: string): ScheduledJob => ({
  name,
  cron,
  ...(tz ? { tz } : {}),
  nextRunAt: new Date(Date.parse(NOW) - minutesAgo * 60_000),
});

function setup(jobs: ScheduledJob[]) {
  const repo = createFakeScheduledJobs(jobs);
  const deps: Deps = { clock: createFakeClock(NOW), scheduledJobs: repo };
  return { repo, deps };
}

const okFetch = vi.fn(async () => new Response('ok'));

afterEach(() => {
  jobHandlers.clear();
  okFetch.mockClear();
});

describe('runDueJobs', () => {
  it('runs the due jobs in order of due time and reschedules each with nextRun', async () => {
    const { repo, deps } = setup([due('b', 5), due('a', 10), due('later', -30), due('c', 1)]);
    const calls: string[] = [];
    const handlers = new Map<string, JobHandler>(
      ['a', 'b', 'c', 'later'].map((name) => [name, async () => void calls.push(name)]),
    );

    const report = await runDueJobs({ env, deps, handlers });

    expect(calls).toEqual(['a', 'b', 'c']);
    expect(report).toEqual({ ran: ['a', 'b', 'c'], failed: [], waiting: [], unhandled: [] });
    expect(repo.jobs.get('a')?.nextRunAt.toISOString()).toBe('2026-05-04T10:05:00.000Z');
    // not due: untouched
    expect(repo.jobs.get('later')?.nextRunAt.getTime()).toBeGreaterThan(Date.parse(NOW));
  });

  it('two due jobs run in order and the third waits when the budget runs out', async () => {
    const { repo, deps } = setup([due('first', 30), due('second', 20), due('third', 10)]);
    const order: string[] = [];
    const call = (name: string): JobHandler => async ({ fetch: f }) => {
      await f('https://example.test/' + name);
      order.push(name);
    };
    const handlers = new Map<string, JobHandler>(
      ['first', 'second', 'third'].map((n) => [n, call(n)]),
    );

    // 1 listDue + (1 fetch + 1 markRan) x 2 jobs = 5: the third does not fit
    const first = await runDueJobs({ env, deps, handlers, fetchImpl: okFetch, budgetLimit: 5 });

    expect(order).toEqual(['first', 'second']);
    expect(first.ran).toEqual(['first', 'second']);
    expect(first.waiting).toEqual(['third']);
    expect(okFetch).toHaveBeenCalledTimes(2);
    // the waiting job was NOT recorded as run: it is still due
    expect(repo.ran).toEqual(['first', 'second']);
    expect((await repo.listDue(deps.clock.now())).map((j) => j.name)).toEqual(['third']);

    // next tick: fresh budget, the third one runs
    const second = await runDueJobs({ env, deps, handlers, fetchImpl: okFetch, budgetLimit: 5 });
    expect(second.ran).toEqual(['third']);
    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('a job that overruns the budget after others ran stays due and waits for the next tick', async () => {
    const { repo, deps } = setup([due('small', 20), due('greedy', 10)]);
    const handlers = new Map<string, JobHandler>([
      ['small', async ({ fetch: f }) => void (await f('https://example.test/small'))],
      [
        'greedy',
        async ({ fetch: f }) => {
          for (let i = 0; i < 3; i++) await f('https://example.test/' + i);
        },
      ],
    ]);

    // 1 listDue + small (1 + 1 markRan) + greedy reserves its markRan and gets 2 of the 3 calls it wants
    const report = await runDueJobs({ env, deps, handlers, fetchImpl: okFetch, budgetLimit: 6 });

    expect(report).toMatchObject({ ran: ['small'], failed: [], waiting: ['greedy'] });
    expect(repo.ran).toEqual(['small']);
  });

  it('a job that alone overruns a full budget is a failure: rescheduled, and the queue moves on', async () => {
    const { repo, deps } = setup([due('greedy', 20), due('after', 10)]);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handlers = new Map<string, JobHandler>([
      [
        'greedy',
        async ({ fetch: f }) => {
          await f('https://example.test/1');
          await f('https://example.test/2');
        },
      ],
      ['after', async () => undefined],
    ]);

    // 1 listDue + 1 reserved for greedy's markRan leaves greedy 1 call: it can never fit
    const first = await runDueJobs({ env, deps, handlers, fetchImpl: okFetch, budgetLimit: 3 });

    expect(first).toMatchObject({ ran: [], failed: ['greedy'], waiting: ['after'] });
    expect(repo.ran).toEqual(['greedy']);
    expect(String(errors.mock.calls[0]?.[0])).toContain('"job":"greedy"');
    expect(String(errors.mock.calls[0]?.[0])).toContain('budget_exhausted');

    // next tick: greedy is not due until its next run, so it no longer blocks the one after it
    const second = await runDueJobs({ env, deps, handlers, fetchImpl: okFetch, budgetLimit: 3 });
    expect(second).toMatchObject({ ran: ['after'], failed: [], waiting: [] });
    errors.mockRestore();
  });

  it('counts the repository calls (listDue + one markRan per job) in the same budget', async () => {
    const jobs = ['a', 'b', 'c', 'd', 'e'].map((n, i) => due(n, 50 - i));
    const { repo, deps } = setup(jobs);
    let repoCalls = 0;
    const counted: Deps = {
      ...deps,
      scheduledJobs: {
        listDue: async (now) => (repoCalls++, repo.listDue(now)),
        markRan: async (...args) => (repoCalls++, repo.markRan(...args)),
        disable: async (...args) => (repoCalls++, repo.disable(...args)),
      },
    };
    const handlers = new Map<string, JobHandler>(
      jobs.map((j) => [
        j.name,
        async ({ fetch: f }) => {
          await f('https://example.test/1');
          await f('https://example.test/2');
        },
      ]),
    );

    const report = await runDueJobs({ env, deps: counted, handlers, fetchImpl: okFetch, budgetLimit: 10 });

    // 1 + 3 x (2 fetch + 1 markRan) = 10
    expect(report).toMatchObject({ ran: ['a', 'b', 'c'], waiting: ['d', 'e'] });
    expect(okFetch.mock.calls.length + repoCalls).toBe(10);
  });

  it('by default a tick stays at 40 subrequests in total (Workers Free allows 50)', async () => {
    const jobs = Array.from({ length: 30 }, (_, i) => due(`job${String(i).padStart(2, '0')}`, 60 - i));
    const { repo, deps } = setup(jobs);
    let repoCalls = 0;
    const counted: Deps = {
      ...deps,
      scheduledJobs: {
        listDue: async (now) => (repoCalls++, repo.listDue(now)),
        markRan: async (...args) => (repoCalls++, repo.markRan(...args)),
        disable: async (...args) => (repoCalls++, repo.disable(...args)),
      },
    };
    const handlers = new Map<string, JobHandler>(
      jobs.map((j) => [j.name, async ({ fetch: f }) => void (await f('https://example.test/' + j.name))]),
    );

    const report = await runDueJobs({ env, deps: counted, handlers, fetchImpl: okFetch });

    expect(okFetch.mock.calls.length + repoCalls).toBeLessThanOrEqual(40);
    expect(report.ran.length + report.waiting.length).toBe(30);
    expect(report.waiting.length).toBeGreaterThan(0);
  });

  it('a job whose time zone or cron cannot produce a next run is disabled without running, and the rest go on', async () => {
    const { repo, deps } = setup([
      due('typo.tz', 30, '0 8 * * *', 'Europe/Madird'),
      due('never', 20, '0 0 30 2 *'),
      due('fine', 10),
    ]);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const calls: string[] = [];
    const handlers = new Map<string, JobHandler>(
      ['typo.tz', 'never', 'fine'].map((name) => [name, async () => void calls.push(name)]),
    );

    const report = await runDueJobs({ env, deps, handlers });

    expect(calls).toEqual(['fine']);
    expect(report).toMatchObject({ ran: ['fine'], failed: ['typo.tz', 'never'], waiting: [] });
    expect(repo.disabled).toEqual(['typo.tz', 'never']);
    expect(repo.ran).toEqual(['fine']);
    const logged = errors.mock.calls.map((c) => String(c[0]));
    expect(logged[0]).toContain('"job":"typo.tz"');
    expect(logged[0]).toContain('Invalid time zone');
    expect(logged[1]).toContain('never fires');

    // disabled jobs are not listed again: no hot loop
    const next = await runDueJobs({ env, deps, handlers });
    expect(next.failed).toEqual([]);
    expect(calls).toEqual(['fine']);
    errors.mockRestore();
  });

  it('counts env.AI.run against the same budget as fetch', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const run = vi.fn(async () => ({ response: 'hola' }));
    const { deps } = setup([due('ai', 5)]);
    const used: number[] = [];
    const handlers = new Map<string, JobHandler>([
      [
        'ai',
        async ({ env: e, budget, fetch: f }) => {
          await f('https://example.test/1');
          await e.AI?.run('@cf/model', { messages: [] });
          used.push(budget.used);
          await e.AI?.run('@cf/model', { messages: [] });
        },
      ],
    ]);

    const report = await runDueJobs({
      env: { ...env, AI: { run } },
      deps,
      handlers,
      fetchImpl: okFetch,
      // 1 listDue + 1 reserved for markRan + fetch + one AI.run
      budgetLimit: 4,
    });

    expect(used).toEqual([3]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(report.failed).toEqual(['ai']);
    errors.mockRestore();
  });

  it('a failing job is logged, rescheduled (no hot loop) and does not stop the others', async () => {
    const { repo, deps } = setup([due('broken', 20), due('fine', 10)]);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handlers = new Map<string, JobHandler>([
      [
        'broken',
        async () => {
          throw new Error('boom');
        },
      ],
      ['fine', async () => undefined],
    ]);

    const report = await runDueJobs({ env, deps, handlers });

    expect(report).toMatchObject({ ran: ['fine'], failed: ['broken'] });
    expect(repo.ran).toEqual(['broken', 'fine']);
    expect(String(errors.mock.calls[0]?.[0])).toContain('"job":"broken"');
    errors.mockRestore();
  });

  it('leaves due jobs without a handler untouched', async () => {
    const { repo, deps } = setup([due('radar.sweep', 5)]);
    const report = await runDueJobs({ env, deps, handlers: new Map() });
    expect(report.unhandled).toEqual(['radar.sweep']);
    expect(repo.ran).toEqual([]);
  });

  it('computes the next run in the time zone of the job', async () => {
    const { repo, deps } = setup([due('radar.daily', 5, '0 8 * * *', 'Europe/Madrid')]);
    await runDueJobs({ env, deps, handlers: new Map([['radar.daily', async () => undefined]]) });
    expect(repo.jobs.get('radar.daily')?.nextRunAt.toISOString()).toBe('2026-05-05T06:00:00.000Z');
  });

  it('does nothing without a scheduled-jobs repo (table arrives with migration 1.8)', async () => {
    const report = await runDueJobs({ env, deps: { clock: createFakeClock(NOW) }, handlers: new Map() });
    expect(report).toEqual({ ran: [], failed: [], waiting: [], unhandled: [] });
  });
});

describe('scheduled() entry point', () => {
  it('builds its deps through the same env.__deps hook as the routes', async () => {
    const { repo, deps } = setup([due('tick', 5)]);
    const seen: string[] = [];
    jobHandlers.set('tick', async ({ now }) => void seen.push(now.toISOString()));

    await scheduled(
      { cron: '*/5 * * * *', scheduledTime: Date.parse(NOW), noRetry: () => undefined } as ScheduledController,
      { ...env, TEST: '1', __deps: deps } as Env,
    );

    expect(seen).toEqual([NOW]);
    expect(repo.ran).toEqual(['tick']);
  });
});
