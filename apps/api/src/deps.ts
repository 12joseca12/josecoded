// Composition root of the gateway (working-agreements §17.1).
// Ports live in @josecoded/types (api.ts); real adapters live in src/adapters/ and are the only files
// that import SDKs or call third parties. Routes and middlewares receive `c.var.deps`; they never import adapters.
import { createNoticeLedger, createOutboxRepo } from './adapters/outbox';
import { createScheduledJobsRepo } from './adapters/scheduled-jobs';
import { createSupabaseAdapters, type SupabaseGateway } from './adapters/supabase';
import { createTelegramNotifier } from './adapters/telegram';
import { parseEnv } from './config/env';

import type { Env } from './types/env.types';
import type { Clock, NoticeLedger, Notifier, OutboxRepo, ScheduledJobsRepo } from '@josecoded/types';

export interface Deps {
  clock: Clock;
  /** Auth, admin check and the service client of the Supabase project (adapters/supabase.ts). */
  supabase: SupabaseGateway;
  /**
   * Source of the scheduled-jobs dispatcher (`private.scheduled_jobs`). Undefined without SUPABASE_SECRET_KEY,
   * in which case the dispatcher finds nothing to run. Tests inject a fake.
   */
  scheduledJobs?: ScheduledJobsRepo;
  /** `private.outbox` (claim/ack/fail RPCs). Undefined without SUPABASE_SECRET_KEY. */
  outbox?: OutboxRepo;
  /** Once-only marks of notices sent by a request and backed up by the outbox. Undefined without the secret key. */
  notices?: NoticeLedger;
  /** Jose's Telegram. Undefined without TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID. */
  telegram?: Notifier;
}

/** Hono generics of the gateway app: the bindings plus what the middlewares leave in `c.var`. */
export type AppEnv = {
  Bindings: Env;
  Variables: { deps: Deps };
};

/** Test-only bindings: `__deps` replaces ports, and is read only when `TEST === '1'`. */
type TestBindings = { TEST?: string; __deps?: Partial<Deps> };

/**
 * Builds the real dependencies once per request, from the env validated by `parseEnv`. Nothing here opens a
 * connection: the service client is created on first use.
 */
export function buildDeps(env: Env): Deps {
  const { gateway, rpc } = createSupabaseAdapters(env);
  const telegram = createTelegramNotifier(env);
  return {
    clock: { now: () => new Date() },
    supabase: gateway,
    ...(rpc
      ? { scheduledJobs: createScheduledJobsRepo(rpc), outbox: createOutboxRepo(rpc), notices: createNoticeLedger(rpc) }
      : {}),
    ...(telegram ? { telegram } : {}),
  };
}

/**
 * `buildDeps(parseEnv(env))` plus, in tests, the ports overridden by `env.__deps` (fakes of test/fakes/).
 * Two locks keep the override out of production: `__TEST_HOOKS__` is `false` in every wrangler build, so
 * esbuild drops the branch (and the string `__deps`) from the bundle; and `TEST` must be exactly '1'.
 * An invalid env throws `Invalid environment: …`, which app.onError answers with a 500 that names nothing.
 */
export function resolveDeps(env: Env): Deps {
  const real = buildDeps(parseEnv(env));
  if (__TEST_HOOKS__) {
    const { TEST, __deps } = env as Env & TestBindings;
    if (TEST === '1' && __deps) return { ...real, ...__deps };
  }
  return real;
}
