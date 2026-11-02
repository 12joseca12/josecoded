import { expect, it, vi } from 'vitest';

it('switches zod JIT off without importing zod', async () => {
  vi.resetModules();
  delete (globalThis as { __zod_globalConfig?: object }).__zod_globalConfig;
  await import('./instrumentation-client');
  const { z } = await import('zod');
  expect(z.config().jitless).toBe(true);
});
