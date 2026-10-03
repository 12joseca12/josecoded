import { createMiddleware } from 'hono/factory';

import { buildDeps, type AppEnv, type Deps } from '../deps';

/** Test-only bindings: `__deps` replaces ports, and is read only when `TEST === '1'`. */
type TestBindings = { TEST?: string; __deps?: Partial<Deps> };

/**
 * Leaves `buildDeps(env)` in `c.var.deps`, built once per request.
 * In tests, `env.__deps` overrides individual ports with the fakes of test/fakes/ (working-agreements §17.1).
 * Production never sets `TEST`, so the override is inert there even if a `__deps` binding appeared.
 */
export const withDeps = createMiddleware<AppEnv>(async (c, next) => {
  const real = buildDeps(c.env);
  const { TEST, __deps } = c.env as typeof c.env & TestBindings;
  c.set('deps', TEST === '1' && __deps ? { ...real, ...__deps } : real);
  await next();
});
