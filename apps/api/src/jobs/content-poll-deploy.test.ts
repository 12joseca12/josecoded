import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pollContentDeploys } from './content-poll-deploy';
import { createFakeClock } from '../../test/fakes/clock.fake';
import { createFakePublications, createFakeRepoWriter } from '../../test/fakes/content.fake';
import { DEPLOY_RUN_TIMEOUT_MS } from '../services/content-publish.service';
import { createSubrequestBudget } from '../utils/subrequest-budget';

import type { Deps } from '../deps';
import type { Env } from '../types/env.types';

const env = { API_MODE: 'development', CORS_ORIGINS: '', SUPABASE_URL: 'http://127.0.0.1:54321' } satisfies Env;
const NOW = new Date('2026-11-02T12:00:00Z');
const sha = (c: string) => c.repeat(40);
const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

function setup(rows: Parameters<typeof createFakePublications>[0], budgetLimit = 40) {
  const publications = createFakePublications(rows);
  const repoWriter = createFakeRepoWriter();
  const deps = { clock: createFakeClock(), contentPublications: publications, repoWriter } as unknown as Deps;
  const budget = createSubrequestBudget(fetch, budgetLimit);
  const run = (override: Partial<Deps> = {}) => pollContentDeploys({ env, deps: { ...deps, ...override }, budget, fetch, now: NOW });
  return { publications, repoWriter, run, budget };
}

const committedAt = new Date(NOW.getTime() - 5 * 60_000);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('content.poll_deploy', () => {
  it('marks deployed when the run of the commit succeeded, with its run id', async () => {
    const { publications, repoWriter, run } = setup([{ id: id(1), status: 'committed', commitSha: sha('a'), committedAt }]);
    repoWriter.runs.set(sha('a'), { id: 777, status: 'completed', conclusion: 'success' });
    await run();
    expect(publications.marks).toEqual([{ id: id(1), status: 'deployed', runId: 777 }]);
  });

  it('marks failed when the run ended badly', async () => {
    const { publications, repoWriter, run } = setup([{ id: id(1), status: 'committed', commitSha: sha('a'), committedAt }]);
    repoWriter.runs.set(sha('a'), { id: 8, status: 'completed', conclusion: 'cancelled' });
    await run();
    expect(publications.marks).toEqual([{ id: id(1), status: 'failed', runId: 8, error: 'deploy_cancelled' }]);
  });

  it('leaves a running deploy, and a missing run, for the next tick', async () => {
    const { publications, repoWriter, run } = setup([
      { id: id(1), status: 'committed', commitSha: sha('a'), committedAt },
      { id: id(2), status: 'committed', commitSha: sha('b'), committedAt },
    ]);
    repoWriter.runs.set(sha('a'), { id: 8, status: 'in_progress', conclusion: null });
    await run();
    expect(publications.marks).toEqual([]);
  });

  it('reports no_deploy_run once the wait is over', async () => {
    const { publications, run } = setup([{ id: id(1), status: 'committed', commitSha: sha('a'), committedAt: new Date(NOW.getTime() - DEPLOY_RUN_TIMEOUT_MS - 1000) }]);
    await run();
    expect(publications.marks).toEqual([{ id: id(1), status: 'failed', error: 'no_deploy_run' }]);
  });

  it('does not look at queued, deployed or failed publications', async () => {
    const { repoWriter, run } = setup([
      { id: id(1), status: 'queued' },
      { id: id(2), status: 'deployed', commitSha: sha('a') },
      { id: id(3), status: 'failed', commitSha: sha('b') },
    ]);
    await run();
    expect(repoWriter.runLookups).toEqual([]);
  });

  it('is a no-op without the App or the repository, and stays inside its budget', async () => {
    const without = setup([{ id: id(1), status: 'committed', commitSha: sha('a'), committedAt }]);
    await without.run({ repoWriter: undefined });
    await without.run({ contentPublications: undefined });
    expect(without.budget.used).toBe(0);

    const rows = Array.from({ length: 5 }, (_, i) => ({ id: id(i + 1), status: 'committed' as const, commitSha: sha('abcde'[i]!), committedAt }));
    const tight = setup(rows, 7);
    for (const r of rows) tight.repoWriter.runs.set(r.commitSha, { id: 1, status: 'completed', conclusion: 'success' });
    await tight.run();
    expect(tight.budget.used).toBeLessThanOrEqual(7);
  });

  it('one failing lookup does not stop the others', async () => {
    const { publications, repoWriter, run } = setup([
      { id: id(1), status: 'committed', commitSha: sha('a'), committedAt },
      { id: id(2), status: 'committed', commitSha: sha('b'), committedAt },
    ]);
    repoWriter.runs.set(sha('b'), { id: 2, status: 'completed', conclusion: 'success' });
    const original = repoWriter.workflowRunForSha.bind(repoWriter);
    repoWriter.workflowRunForSha = async (s, hooks) => {
      if (s === sha('a')) throw new Error('github list runs 502');
      return original(s, hooks);
    };
    await run();
    expect(publications.marks).toEqual([{ id: id(2), status: 'deployed', runId: 2 }]);
  });
});
