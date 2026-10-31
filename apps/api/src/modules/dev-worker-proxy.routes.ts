import { Hono, type MiddlewareHandler } from 'hono';

import { parseEnv } from '../config/env';
import { devApiKeyGuard, fixedWindowRateLimit } from '../middlewares/security.middleware';
import { callWorker, isWorkerConfigured, toUpstreamFail, workerFailStatus } from '../services/worker.service';
import { fail } from '../utils/api-response';

import type { Env } from '../types/env.types';

export const devWorkerProxyRoutes = new Hono<{ Bindings: Env }>();

/**
 * The proxy exists only when Omen AND a dev key are configured, and never in production (task 1.8d). Otherwise the
 * path is a plain 404, as if it were not mounted. `devApiKeyGuard` then checks the key itself.
 */
const devProxyEnabled: MiddlewareHandler = async (c, next) => {
  const env = parseEnv(c.env);
  if (env.API_MODE === 'production' || !isWorkerConfigured(env) || !env.DEV_API_KEY) {
    return c.json(fail('not_found', 'Not found'), 404);
  }
  return next();
};

devWorkerProxyRoutes.use('/api/dev/worker/*', devProxyEnabled);
devWorkerProxyRoutes.use('/api/dev/worker/*', devApiKeyGuard);
devWorkerProxyRoutes.use(
  '/api/dev/worker/*',
  fixedWindowRateLimit({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: 'dev-worker-proxy',
  }),
);

const allowedMethods = new Set(['GET', 'POST', 'PUT', 'DELETE'] as const);

devWorkerProxyRoutes.all('/api/dev/worker/*', async (c) => {
  const method = c.req.method.toUpperCase();
  if (!allowedMethods.has(method as (typeof allowedMethods extends Set<infer T> ? T : never))) {
    return c.json(fail('invalid_request', 'Method not allowed'), 405);
  }

  const upstreamPath = c.req.path.replace(/^\/api\/dev\/worker/, '');
  if (!upstreamPath || upstreamPath === '/') {
    return c.json(fail('invalid_request', 'Missing upstream path'), 400);
  }

  const body =
    method === 'POST' || method === 'PUT' || method === 'DELETE'
      ? await c.req.json().catch(() => undefined)
      : undefined;

  try {
    const data = await callWorker<unknown>(c.env, upstreamPath, {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      ...(body !== undefined ? { body } : {}),
    });
    return c.json(data);
  } catch (e) {
    return c.json(toUpstreamFail(e), workerFailStatus(e));
  }
});

