import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { normalizeEnvBindings, parseEnv } from './config/env';
import {
  requestId,
  securityHeaders,
} from './middlewares/security.middleware';
import { withDeps } from './middlewares/with-deps';
import { devWorkerProxyRoutes } from './modules/dev-worker-proxy.routes';
import { healthRoutes } from './modules/health.routes';
import { systemRoutes } from './modules/system.routes';
import { v1Routes } from './modules/v1.routes';
import { scheduled } from './scheduled';
import { fail } from './utils/api-response';
import { isAllowedOrigin, parseOriginList } from './utils/cors-origins';

import type { AppEnv } from './deps';
import type { Env } from './types/env.types';

const app = new Hono<AppEnv>();

app.use('*', requestId);
app.use('*', securityHeaders);
// New modules read c.var.deps (working-agreements §17.1); no legacy route uses it.
app.use('*', withDeps);

app.use('*', async (c, next) => {
  const env = parseEnv(c.env);
  const hasAllowList = parseOriginList(env.CORS_ORIGINS).length > 0;
  const localhostDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '';
      if (hasAllowList) {
        return isAllowedOrigin(origin, env.CORS_ORIGINS) ? origin : '';
      }
      if (env.API_MODE === 'development' && localhostDev.test(origin)) {
        return origin;
      }
      return '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
  return corsMiddleware(c, next);
});

app.route('/', healthRoutes);
app.route('/', systemRoutes);
app.route('/', devWorkerProxyRoutes);
app.route('/api/v1', v1Routes);

app.notFound((c) => {
  return c.json(
    fail('not_found', 'Route not found'),
    404,
  );
});

app.onError((error, c) => {
  // If env is invalid, fail early with a controlled response.
  if (error instanceof Error && error.message.startsWith('Invalid environment:')) {
    // paths and messages only (never values): tells the operator which production var is missing
    console.error(JSON.stringify({ scope: 'env', error: error.message }));
    return c.json(fail('internal_error', 'API misconfigured'), 500);
  }
  return c.json(
    fail('internal_error', 'Internal API error', exposeErrorDetails(c.env) ? errorMessage(error) : undefined),
    500,
  );
});

/** The cause of an unexpected error is returned only in API_MODE=development (the default of a bare env). */
function exposeErrorDetails(rawEnv: unknown): boolean {
  return normalizeEnvBindings(rawEnv).API_MODE === 'development';
}

function errorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

export { app };

export default { fetch: app.fetch, scheduled } satisfies ExportedHandler<Env>;
