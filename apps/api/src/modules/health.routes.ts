import { Hono } from 'hono';

import { ok } from '../utils/api-response';

import type { Env } from '../types/env.types';

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get('/health', (c) => {
  return c.json(
    ok({
      service: 'josecoded-api',
      mode: c.env.API_MODE,
      timestamp: new Date().toISOString(),
    }),
  );
});
