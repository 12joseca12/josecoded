import { defineConfig } from '@playwright/test';

// The URL matrix runs against the LOCAL preview: `opennextjs-cloudflare preview` (populates the
// incremental cache like production, then wrangler dev) serving `.open-next`
// (run `pnpm --filter web build` first). Nothing is uploaded to Cloudflare.
// PW_CHANNEL=chrome uses the system Chrome (no browser download); CI uses bundled Chromium.
const port = Number(process.env.E2E_PORT ?? 8790);

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  reporter: 'list',
  // Jose's 2 % tolerance for screenshot comparisons (working-agreements §5). Baselines are produced ONLY by the
  // `update-snapshots` workflow (CI's Playwright Chromium), never locally; see e2e/README.md.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    channel: process.env.PW_CHANNEL || undefined,
  },
  webServer: {
    command: `pnpm exec opennextjs-cloudflare preview -- --ip 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    // always a fresh server: never test against a stale .open-next served by another process
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
