import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const mockPort = Number(process.env.MOCK_BACKEND_PORT ?? 3199);
const mockOrigin = `http://localhost:${mockPort}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } },
    },
  ],
  webServer: [
    {
      command: "node scripts/e2e-mock-backend.js",
      url: `${mockOrigin}/__health`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: { MOCK_BACKEND_PORT: String(mockPort) },
    },
    {
      command: `pnpm start --port ${port}`,
      url: `http://localhost:${port}/es`,
      reuseExistingServer: !process.env.CI && !process.env.E2E_PORT,
      timeout: 60_000,
      env: {
        ENABLE_DEV_PAGES: "true",
        NEXT_PUBLIC_SUPABASE_URL: mockOrigin,
        SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
        TURNSTILE_SECRET_KEY: "test-turnstile-secret",
        FORM_IP_HASH_SECRET: "test-ip-hash-secret",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SCRIPT_URL: `${mockOrigin}/turnstile/api.js`,
        TURNSTILE_VERIFY_URL: `${mockOrigin}/turnstile/siteverify`,
      },
    },
  ],
});
