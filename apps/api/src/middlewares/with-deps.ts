import { createMiddleware } from 'hono/factory';

import { buildDeps, type AppEnv, type Deps } from '../deps';

/** Test-only bindings: `__deps` replaces ports, and is read only when `TEST === '1'`. */
type TestBindings = { TEST?: string; __deps?: Partial<Deps> };

/**
 * Leaves `buildDeps(env)` in `c.var.deps`, built once per request.
 * In tests, `env.__deps` overrides individual ports with the fakes of test/fakes/ (working-agreements §17.1).
 * Two locks keep it out of production: `__TEST_HOOKS__` is `false` in every wrangler build, so esbuild drops
 * the branch (and the string `__deps`) from the bundle; and `TEST` must be exactly '1' at runtime.
 */
export const withDeps = createMiddleware<AppEnv>(async (c, next) => {
  const real = buildDeps(c.env);
  let deps = real;
  if (__TEST_HOOKS__) {
    const { TEST, __deps } = c.env as typeof c.env & TestBindings;
    if (TEST === '1' && __deps) deps = { ...real, ...__deps };
  }
  c.set('deps', deps);
  await next();
});
