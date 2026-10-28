// Single Cron Trigger `*/5 * * * *` dispatcher (DT §0b, finding 35). Workers Free allows 5 crons per account,
// so every periodic job (outbox drain, Radar, newsletter, ...) is a row of `private.scheduled_jobs` and
// each tick runs the DUE ones, in order, inside a subrequest budget; what does not fit waits for the next tick.
import { parseEnv } from './config/env';
import { resolveDeps, type Deps } from './deps';
import { drainOutbox, OUTBOX_DRAIN } from './jobs/outbox-drain';
import { nextRun } from './utils/cron';
import { BudgetExhaustedError, createSubrequestBudget } from './utils/subrequest-budget';

import type { JobHandler } from './jobs/job';
import type { Env } from './types/env.types';

export type { JobContext, JobHandler } from './jobs/job';

/** name (row of scheduled_jobs) -> handler. Each module registers its jobs here (chat 4.x, Radar 7.x, newsletter 10.x). */
export const jobHandlers = new Map<string, JobHandler>([[OUTBOX_DRAIN, drainOutbox]]);

export type TickReport = {
  ran: string[];
  failed: string[];
  /** Due jobs that did not run this tick (budget spent) and stay due. */
  waiting: string[];
  /** Due jobs with no registered handler: left untouched. */
  unhandled: string[];
};

function logJobError(job: string, error: unknown): void {
  console.error(
    JSON.stringify({
      scope: 'scheduled',
      job,
      message: error instanceof Error ? error.message : 'unknown',
    }),
  );
}

/**
 * Runs the due jobs in order. Every call to the repository counts in the same budget as the handlers (one
 * listDue, then one markRan or disable per job, set aside before the handler starts), so a tick never goes over
 * `budgetLimit` subrequests in total.
 */
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
  budget.take();
  const due = await repo.listDue(now);
  const waitFrom = (index: number) =>
    report.waiting.push(...due.slice(index).map((j) => j.name).filter((n) => handlers.has(n)));
  let handlersRun = 0;

  for (const [index, job] of due.entries()) {
    const handler = handlers.get(job.name);
    if (!handler) {
      report.unhandled.push(job.name);
      continue;
    }
    // the job's own markRan (or disable) must fit, whatever the handler does
    if (budget.remaining <= 0) {
      waitFrom(index);
      break;
    }
    budget.reserve();

    // Computed before running: `now` is fixed for the tick, and a schedule that cannot produce a next run
    // (unknown tz, 30 February) must neither abort the batch nor fire again every tick. The row is disabled.
    let next: Date;
    try {
      next = nextRun(job.cron, now, job.tz);
    } catch (error) {
      logJobError(job.name, error);
      budget.takeReserved();
      await repo.disable(job.name, error instanceof Error ? error.message : 'unknown');
      report.failed.push(job.name);
      continue;
    }

    const firstHandler = handlersRun === 0;
    handlersRun += 1;
    try {
      await handler({ env: budgetedEnv, deps, budget, fetch: budget.fetch, now });
      report.ran.push(job.name);
    } catch (error) {
      if (error instanceof BudgetExhaustedError && !firstHandler) {
        // not recorded as run: it stays due, and so does everything after it; next tick it starts earlier
        waitFrom(index);
        break;
      }
      // A broken job must not fire again every 5 minutes: it is rescheduled and logged. That includes a job
      // that spent the whole budget of a tick on its own: it would never fit, and retrying it would block the
      // queue for good.
      logJobError(job.name, error);
      report.failed.push(job.name);
    }
    budget.takeReserved();
    await repo.markRan(job.name, now, next);
  }
  return report;
}

/**
 * Cron entry point. Jobs get the env validated by `parseEnv`, like the routes; the deps are resolved from the
 * raw bindings (as `withDeps` does), because the test hook `__deps` is not part of the schema.
 */
export async function scheduled(_event: ScheduledController, rawEnv: Env): Promise<void> {
  const env = parseEnv(rawEnv);
  await runDueJobs({ env, deps: resolveDeps(rawEnv) });
}
