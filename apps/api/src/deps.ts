// Composition root of the NEW gateway modules (working-agreements §17.1).
// Ports live in @josecoded/types (api.ts); real adapters live in src/adapters/ and are the only files
// that import SDKs or call third parties. Routes receive `c.var.deps`; they never import adapters.
// The legacy modules (v1, v1-protected, forum, admin-chat, health, system) do not use this.
import type { Env } from './types/env.types';
import type { Clock, ScheduledJobsRepo } from '@josecoded/types';

export interface Deps {
  clock: Clock;
  /**
   * Source of the scheduled-jobs dispatcher. No real adapter yet: `private.scheduled_jobs` is created by
   * migration 1.8, so until then the dispatcher finds nothing to run. Tests inject a fake.
   */
  scheduledJobs?: ScheduledJobsRepo;
}

/** Hono generics of the gateway app: the bindings plus what the middlewares leave in `c.var`. */
export type AppEnv = {
  Bindings: Env;
  Variables: { deps: Deps };
};

/** Test-only bindings: `__deps` replaces ports, and is read only when `TEST === '1'`. */
type TestBindings = { TEST?: string; __deps?: Partial<Deps> };

/**
 * Builds the real dependencies once per request. Each adapter added by a later task goes here.
 * The clock is trivial enough to live inline until a second adapter justifies the folder.
 */
export function buildDeps(env: Env): Deps {
  void env;
  return {
    clock: { now: () => new Date() },
  };
}

/**
 * `buildDeps(env)` plus, in tests, the ports overridden by `env.__deps` (fakes of test/fakes/).
 * Two locks keep the override out of production: `__TEST_HOOKS__` is `false` in every wrangler build, so
 * esbuild drops the branch (and the string `__deps`) from the bundle; and `TEST` must be exactly '1'.
 */
export function resolveDeps(env: Env): Deps {
  const real = buildDeps(env);
  if (__TEST_HOOKS__) {
    const { TEST, __deps } = env as Env & TestBindings;
    if (TEST === '1' && __deps) return { ...real, ...__deps };
  }
  return real;
}
