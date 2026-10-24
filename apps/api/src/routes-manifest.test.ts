import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { app } from './index';
import { routes } from './routes-manifest';

type RouteEntry = { method: string; path: string; handler: { length: number } };

const key = (r: { method: string; path: string }) => `${r.method} ${r.path}`;
const DEV_PROXY = 'ALL /api/dev/worker/*';

/**
 * Real routes of a Hono app. `use` middlewares are registered as ALL too; they are told apart by their
 * `(c, next)` signature, so any `app.all` route handler (one argument) is still counted.
 */
function registeredRoutes(entries: readonly RouteEntry[]): string[] {
  return entries.filter((r) => r.method !== 'ALL' || r.handler.length < 2).map(key);
}

describe('routes manifest', () => {
  const manifest = routes.map(key);

  it('lists the inherited routes without duplicates', () => {
    expect(manifest).toContain('GET /api/v1/health');
    expect(manifest).toContain('GET /api/v1/admin-chat/thread');
    expect(new Set(manifest).size).toBe(manifest.length);
  });

  it('matches what the app registers: nothing missing, nothing extra', () => {
    expect(new Set(manifest)).toEqual(new Set(registeredRoutes(app.routes)));
  });

  it('the only ALL route is the dev proxy', () => {
    expect(registeredRoutes(app.routes).filter((r) => r.startsWith('ALL '))).toEqual([DEV_PROXY]);
  });

  it('a new app.all route is counted (so it fails the check until it is in the manifest)', () => {
    const probe = new Hono();
    probe.use('*', async (_c, next) => next());
    probe.all('/api/dev/worker/*', (c) => c.text('proxy'));
    probe.all('/api/v1/new', (c) => c.text('new'));
    expect(registeredRoutes(probe.routes)).toEqual([DEV_PROXY, 'ALL /api/v1/new']);
  });
});
