import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', '.open-next', 'e2e'],
    typecheck: { enabled: true, include: ['tests/**/*.test-d.ts'] },
  },
});
