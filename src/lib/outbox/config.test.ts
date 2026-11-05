import { describe, expect, it } from "vitest";

import { readCronSecret, readOutboxConfig, readWebhookSecret } from "./config";

const production = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  RESEND_API_KEY: "re_live",
  RESEND_FROM: "josecoded <avisos@josecoded.com>",
  TELEGRAM_BOT_TOKEN: "123:abc",
};

const local = { NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3199" };

describe("readOutboxConfig", () => {
  it("is empty without secrets", () => {
    expect(readOutboxConfig({})).toEqual({ resend: null, telegram: null });
  });

  it("builds both providers from the secrets with the public API hosts", () => {
    expect(readOutboxConfig(production)).toEqual({
      resend: {
        apiKey: "re_live",
        from: "josecoded <avisos@josecoded.com>",
        baseUrl: "https://api.resend.com",
      },
      telegram: { token: "123:abc", baseUrl: "https://api.telegram.org" },
    });
  });

  it("needs a sender address to send email outside local mode", () => {
    expect(readOutboxConfig({ ...production, RESEND_FROM: "" }).resend).toBeNull();
  });

  it("ignores API host overrides outside local mode and disables the provider", () => {
    const config = readOutboxConfig({
      ...production,
      RESEND_API_URL: "http://localhost:9",
      TELEGRAM_API_URL: "http://localhost:9",
    });
    expect(config).toEqual({ resend: null, telegram: null });
  });

  it("honours loopback overrides in local mode", () => {
    const config = readOutboxConfig({
      ...local,
      RESEND_API_KEY: "re_test",
      RESEND_API_URL: "http://localhost:3199/resend",
      TELEGRAM_BOT_TOKEN: "1:t",
      TELEGRAM_API_URL: "http://localhost:3199/telegram",
    });
    expect(config.resend?.baseUrl).toBe("http://localhost:3199/resend");
    expect(config.telegram?.baseUrl).toBe("http://localhost:3199/telegram");
  });

  it("refuses a non loopback override even in local mode", () => {
    const config = readOutboxConfig({
      ...local,
      RESEND_API_KEY: "re_test",
      RESEND_API_URL: "https://evil.example",
    });
    expect(config.resend).toBeNull();
  });
});

describe("secrets", () => {
  it("reads the cron and webhook secrets when present", () => {
    expect(readCronSecret({ CRON_SECRET: " abc " })).toBe("abc");
    expect(readCronSecret({})).toBeNull();
    expect(readWebhookSecret({ TELEGRAM_WEBHOOK_SECRET: "xyz" })).toBe("xyz");
    expect(readWebhookSecret({ TELEGRAM_WEBHOOK_SECRET: "" })).toBeNull();
  });
});
