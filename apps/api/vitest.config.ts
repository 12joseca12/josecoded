import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Gateway tests run inside workerd (Miniflare, local only: nothing here talks to Cloudflare).
// remoteBindings: false keeps the remote-only `ai` binding of wrangler.jsonc out of the run (no Cloudflare login,
// no network): tests that need AI inject a fake through `env.__deps` (test/fakes/, working-agreements §17.1).
export default defineConfig({
  // Test hooks (env.__deps) exist only under Vitest; wrangler.jsonc defines the flag as false.
  define: { __TEST_HOOKS__: 'true' },
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' }, remoteBindings: false })],
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
