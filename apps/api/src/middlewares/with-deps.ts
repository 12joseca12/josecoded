import { createMiddleware } from 'hono/factory';

import { resolveDeps, type AppEnv } from '../deps';

/** Leaves the dependencies of the request in `c.var.deps` (real ones; fakes only under test, see `resolveDeps`). */
export const withDeps = createMiddleware<AppEnv>(async (c, next) => {
  c.set('deps', resolveDeps(c.env));
  await next();
});
