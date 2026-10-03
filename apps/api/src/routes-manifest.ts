// Every route the gateway registers, written by hand (not derived from the Hono app). `apps/web` reads it in
// `build-info.ts` for the "how it is built" count. routes-manifest.test.ts fails if it drifts from
// `app.routes`, so a new route must be added here in the same commit. `ALL` is only the dev proxy.
// Middlewares (`use`) are not listed.
export type RouteModule =
  | 'health'
  | 'system'
  | 'v1'
  | 'v1-protected'
  | 'forum'
  | 'admin-chat'
  | 'admin-chat-admin'
  | 'dev-worker-proxy';

export type RouteEntry = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  readonly path: string;
  readonly module: RouteModule;
};

export const routes = [
  { method: 'ALL', path: '/api/dev/worker/*', module: 'dev-worker-proxy' },
  { method: 'DELETE', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments/:commentId', module: 'forum' },
  { method: 'GET', path: '/api/v1/admin-chat/admin/conversations', module: 'admin-chat-admin' },
  { method: 'GET', path: '/api/v1/admin-chat/admin/conversations/:id/messages', module: 'admin-chat-admin' },
  { method: 'GET', path: '/api/v1/admin-chat/thread', module: 'admin-chat' },
  { method: 'GET', path: '/api/v1/auth/me', module: 'v1-protected' },
  { method: 'GET', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug', module: 'forum' },
  { method: 'GET', path: '/api/v1/forum/popular', module: 'forum' },
  { method: 'GET', path: '/api/v1/forum/search', module: 'forum' },
  { method: 'GET', path: '/api/v1/forum/thematics', module: 'forum' },
  { method: 'GET', path: '/api/v1/forum/thematics/:slug/entries', module: 'forum' },
  { method: 'GET', path: '/api/v1/health', module: 'v1' },
  { method: 'GET', path: '/api/v1/system/status', module: 'v1-protected' },
  { method: 'GET', path: '/health', module: 'health' },
  { method: 'GET', path: '/system/status', module: 'system' },
  { method: 'POST', path: '/api/v1/admin-chat/admin/conversations/:id/ai', module: 'admin-chat-admin' },
  { method: 'POST', path: '/api/v1/admin-chat/admin/conversations/:id/messages', module: 'admin-chat-admin' },
  { method: 'POST', path: '/api/v1/admin-chat/admin/conversations/:id/read', module: 'admin-chat-admin' },
  { method: 'POST', path: '/api/v1/admin-chat/meeting', module: 'admin-chat' },
  { method: 'POST', path: '/api/v1/admin-chat/messages', module: 'admin-chat' },
  { method: 'POST', path: '/api/v1/admin-chat/n8n/inbound', module: 'admin-chat' },
  { method: 'POST', path: '/api/v1/forum/entries', module: 'forum' },
  { method: 'POST', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments', module: 'forum' },
  { method: 'POST', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments/:commentId/branch', module: 'forum' },
  { method: 'POST', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments/:commentId/like', module: 'forum' },
  { method: 'POST', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments/:commentId/useful', module: 'forum' },
  { method: 'PUT', path: '/api/v1/forum/entries/:thematicSlug/:entrySlug/comments/:commentId', module: 'forum' },
] as const satisfies readonly RouteEntry[];
