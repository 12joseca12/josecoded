import { createMiddleware } from 'hono/factory';

import { buildDeps, type AppEnv } from '../deps';

/** Leaves `buildDeps(env)` in `c.var.deps`, built once per request. */
export const withDeps = createMiddleware<AppEnv>(async (c, next) => {
  c.set('deps', buildDeps(c.env));
  await next();
});
