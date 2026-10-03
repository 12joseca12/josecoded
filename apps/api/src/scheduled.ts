// Single Cron Trigger `*/5 * * * *` dispatcher (DT §0b, finding 35). Workers Free allows 5 crons per account,
// so every periodic job (Radar, newsletter, lead-notify retries, ...) is a row of `private.scheduled_jobs` and
// each tick runs the DUE ones, in order, inside a subrequest budget; what does not fit waits for the next tick.
import { resolveDeps, type Deps } from './deps';
import { nextRun } from './utils/cron';
import {
  BudgetExhaustedError,
  createSubrequestBudget,
  type SubrequestBudget,
} from './utils/subrequest-budget';

import type { Env } from './types/env.types';

export type JobContext = {
  /** `env` whose `AI.run` is counted by the budget. */
  env: Env;
  deps: Deps;
  budget: SubrequestBudget;
  /** Budgeted `fetch`: handlers must use this one, not the global. */
  fetch: typeof fetch;
  now: Date;
};

/** Handlers must be idempotent: a job that hits the budget is retried from the start on the next tick. */
export type JobHandler = (ctx: JobContext) => Promise<void>;

/** name (row of scheduled_jobs) -> handler. Empty until each module registers its jobs (7.x, 10.x). */
export const jobHandlers = new Map<string, JobHandler>();

export type TickReport = {
  ran: string[];
  failed: string[];
  /** Due jobs that did not run this tick (budget spent) and stay due. */
  waiting: string[];
  /** Due jobs with no registered handler: left untouched. */
  unhandled: string[];
};

export async function runDueJobs(options: {
  env: Env;
  deps: Deps;
  handlers?: Map<string, JobHandler>;
  fetchImpl?: typeof fetch;
  budgetLimit?: number;
}): Promise<TickReport> {
  const { env, deps, handlers = jobHandlers } = options;
  const report: TickReport = { ran: [], failed: [], waiting: [], unhandled: [] };
  const repo = deps.scheduledJobs;
  if (!repo) return report;

  const budget = createSubrequestBudget(options.fetchImpl ?? fetch, options.budgetLimit);
  const budgetedEnv: Env = env.AI ? { ...env, AI: budget.ai(env.AI) } : env;
  const now = deps.clock.now();
  const due = await repo.listDue(now);

  for (const [index, job] of due.entries()) {
    const handler = handlers.get(job.name);
    if (!handler) {
      report.unhandled.push(job.name);
      continue;
    }
    if (budget.remaining <= 0) {
      report.waiting.push(...due.slice(index).map((j) => j.name).filter((n) => handlers.has(n)));
      break;
    }
    try {
      await handler({ env: budgetedEnv, deps, budget, fetch: budget.fetch, now });
    } catch (error) {
      if (error instanceof BudgetExhaustedError) {
        // not recorded as run: it stays due, and so does everything after it
        report.waiting.push(...due.slice(index).map((j) => j.name).filter((n) => handlers.has(n)));
        break;
      }
      // a broken job must not fire again every 5 minutes: schedule its next run and log
      console.error(
        JSON.stringify({
          scope: 'scheduled',
          job: job.name,
          message: error instanceof Error ? error.message : 'unknown',
        }),
      );
      report.failed.push(job.name);
    }
    await repo.markRan(job.name, now, nextRun(job.cron, now, job.tz));
    if (!report.failed.includes(job.name)) report.ran.push(job.name);
  }
  return report;
}

export async function scheduled(_event: ScheduledController, env: Env): Promise<void> {
  await runDueJobs({ env, deps: resolveDeps(env) });
}
