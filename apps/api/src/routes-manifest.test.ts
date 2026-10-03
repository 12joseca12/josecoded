import { describe, expect, it } from 'vitest';

import { app } from './index';
import { routes } from './routes-manifest';

const key = (r: { method: string; path: string }) => `${r.method} ${r.path}`;

describe('routes manifest', () => {
  const manifest = routes.map(key);

  it('lists the inherited routes without duplicates', () => {
    expect(manifest).toContain('GET /api/v1/health');
    expect(manifest).toContain('GET /api/v1/admin-chat/thread');
    expect(new Set(manifest).size).toBe(manifest.length);
  });

  it('matches what the app registers: nothing missing, nothing extra', () => {
    // `use` middlewares are registered as ALL; the only real ALL route is the dev proxy
    const registered = app.routes
      .filter((r) => r.method !== 'ALL' || r.path === '/api/dev/worker/*')
      .map(key);
    expect(new Set(manifest)).toEqual(new Set(registered));
  });
});
