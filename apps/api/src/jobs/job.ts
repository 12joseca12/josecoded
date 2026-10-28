// Contract between the scheduled-jobs dispatcher (src/scheduled.ts) and each job handler. Kept apart from the
// dispatcher so a handler can import it without an import cycle.
import type { Deps } from '../deps';
import type { Env } from '../types/env.types';
import type { SubrequestBudget } from '../utils/subrequest-budget';

export type JobContext = {
  /** `env` whose `AI.run` is counted by the budget. */
  env: Env;
  deps: Deps;
  /**
   * Subrequests left in this tick. A handler counts every call it makes (`budget.fetch` does it for `fetch`;
   * calls through deps adapters are counted with `budget.take()`).
   */
  budget: SubrequestBudget;
  /** Budgeted `fetch`: handlers must use this one, not the global. */
  fetch: typeof fetch;
  now: Date;
};

/** Handlers must be idempotent: a job that hits the budget is retried from the start on the next tick. */
export type JobHandler = (ctx: JobContext) => Promise<void>;
