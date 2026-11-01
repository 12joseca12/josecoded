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
import { v1Routes } from './modules/v1.routes';
import { scheduled } from './scheduled';
import { fail } from './utils/api-response';
import { HttpError, logEvent } from './utils/http-error';
import { isOriginAllowed } from './utils/request';

import type { AppEnv } from './deps';
import type { Env } from './types/env.types';

const app = new Hono<AppEnv>();

app.use('*', requestId);
app.use('*', securityHeaders);
// New modules read c.var.deps (working-agreements §17.1); no legacy route uses it.
app.use('*', withDeps);

app.use('*', async (c, next) => {
  const env = parseEnv(c.env);
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '';
      return isOriginAllowed(env, origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    // the assistant identifies the visitor by an HttpOnly cookie; the origin is always an allow-listed one (never *)
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.route('/', healthRoutes);
app.route('/', devWorkerProxyRoutes);
app.route('/api/v1', v1Routes);

app.notFound((c) => {
  return c.json(
    fail('not_found', 'Route not found'),
    404,
  );
});

app.onError((error, c) => {
  // expected failures (bad input, bot check, quota...): the message was written for the caller
  if (error instanceof HttpError) {
    for (const [name, value] of Object.entries(error.headers ?? {})) c.header(name, value);
    return c.json(error.toBody(), error.status);
  }
  // If env is invalid, fail early with a controlled response.
  if (error instanceof Error && error.message.startsWith('Invalid environment:')) {
    // paths and messages only (never values): tells the operator which production var is missing
    console.error(JSON.stringify({ scope: 'env', error: error.message }));
    return c.json(fail('internal_error', 'API misconfigured'), 500);
  }
  // the path only: an error message can carry values from the request (an email in a constraint name, a token)
  logEvent('api', 'unhandled', { path: c.req.path });
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
