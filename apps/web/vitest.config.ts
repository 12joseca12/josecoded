import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // Next resolves `server-only` itself at build time; in Vitest it is an empty module
      'server-only': fileURLToPath(new URL('./tests/helpers/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // next-intl's ESM imports 'next/navigation' without extension: let vite resolve it
    server: { deps: { inline: ['next-intl'] } },
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', '.open-next', 'e2e'],
    typecheck: { enabled: true, include: ['tests/**/*.test-d.ts'] },
  },
});
