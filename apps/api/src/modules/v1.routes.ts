import { Hono } from 'hono';

import { proposalsRoutes } from './proposals.routes';
import { protectedV1Routes } from './v1-protected.routes';
import { ok } from '../utils/api-response';

import type { AppEnv } from '../deps';

export const v1Routes = new Hono<AppEnv>();

v1Routes.get('/health', (c) => {
  return c.json(
    ok({
      service: 'josecoded-api',
      mode: c.env.API_MODE,
      timestamp: new Date().toISOString(),
      version: 'v1',
    }),
  );
});

// forum/* and admin-chat/* were retired with their tables (DATOS §9, Q1); assistant/* (4.4) succeeds admin-chat.
// Public modules (their own guards: Turnstile, server key, signed cookie) go BEFORE the session gate below.
v1Routes.route('/proposals', proposalsRoutes);

v1Routes.route('/', protectedV1Routes);
