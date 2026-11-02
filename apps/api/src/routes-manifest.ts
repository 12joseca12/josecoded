// Every route the gateway registers, written by hand (not derived from the Hono app). `apps/web` reads it in
// `build-info.ts` for the "how it is built" count. routes-manifest.test.ts fails if it drifts from
// `app.routes`, so a new route must be added here in the same commit. `ALL` is only the dev proxy.
// Middlewares (`use`) are not listed. The public GET /system/status was removed in 1.8d. forum/* and admin-chat/* were retired in plan 1.8c (DATOS §9, Q1).
export type RouteModule =
  | 'health'
  | 'v1'
  | 'v1-protected'
  | 'proposals'
  | 'assistant'
  | 'leads'
  | 'affiliates'
  | 'notify'
  | 'telegram'
  | 'dev-worker-proxy';

export type RouteEntry = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  readonly path: string;
  readonly module: RouteModule;
};

export const routes = [
  { method: 'ALL', path: '/api/dev/worker/*', module: 'dev-worker-proxy' },
  { method: 'GET', path: '/api/v1/affiliates/validate', module: 'affiliates' },
  { method: 'GET', path: '/api/v1/assistant/admin/threads', module: 'assistant' },
  { method: 'GET', path: '/api/v1/assistant/admin/threads/:id', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/admin/threads/:id/ai', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/admin/threads/:id/messages', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/admin/threads/:id/read', module: 'assistant' },
  { method: 'GET', path: '/api/v1/assistant/threads/current', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/threads', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/threads/:id/case', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/threads/:id/claim', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/threads/:id/messages', module: 'assistant' },
  { method: 'POST', path: '/api/v1/assistant/threads/:id/quick-contact', module: 'assistant' },
  { method: 'GET', path: '/api/v1/auth/me', module: 'v1-protected' },
  { method: 'GET', path: '/api/v1/health', module: 'v1' },
  { method: 'POST', path: '/api/v1/leads', module: 'leads' },
  { method: 'POST', path: '/api/v1/notify/test', module: 'notify' },
  { method: 'POST', path: '/api/v1/proposals/generate', module: 'proposals' },
  { method: 'POST', path: '/api/v1/telegram/webhook', module: 'telegram' },
  { method: 'GET', path: '/api/v1/system/status', module: 'v1-protected' },
  { method: 'GET', path: '/health', module: 'health' },
] as const satisfies readonly RouteEntry[];
