import { defineConfig } from 'vitest/config';

// ESLint/stylelint tests load eslint-config-next and the plugins on first use;
// on CI runners that cold start exceeds vitest's 5 s default.
export default defineConfig({
  test: {
    testTimeout: 30_000,
  },
});
