// Every route the gateway registers, written by hand (not derived from the Hono app). `apps/web` reads it in
// `build-info.ts` for the "how it is built" count. routes-manifest.test.ts fails if it drifts from
// `app.routes`, so a new route must be added here in the same commit. `ALL` is only the dev proxy.
// Middlewares (`use`) are not listed. forum/* and admin-chat/* were retired in plan 1.8c (DATOS §9, Q1).
export type RouteModule =
  | 'health'
  | 'system'
  | 'v1'
  | 'v1-protected'
  | 'dev-worker-proxy';

export type RouteEntry = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  readonly path: string;
  readonly module: RouteModule;
};

export const routes = [
  { method: 'ALL', path: '/api/dev/worker/*', module: 'dev-worker-proxy' },
  { method: 'GET', path: '/api/v1/auth/me', module: 'v1-protected' },
  { method: 'GET', path: '/api/v1/health', module: 'v1' },
  { method: 'GET', path: '/api/v1/system/status', module: 'v1-protected' },
  { method: 'GET', path: '/health', module: 'health' },
  { method: 'GET', path: '/system/status', module: 'system' },
] as const satisfies readonly RouteEntry[];
