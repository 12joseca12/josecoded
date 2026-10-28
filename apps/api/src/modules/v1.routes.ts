import { Hono } from 'hono';

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
v1Routes.route('/', protectedV1Routes);
