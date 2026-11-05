import { isLoopbackMode, overrideUrl, present } from "@/lib/contact/env";
import type { OutboxConfig } from "@/types/outbox";

type Env = Record<string, string | undefined>;

export const resendBaseUrl = "https://api.resend.com";
export const telegramBaseUrl = "https://api.telegram.org";

export function readOutboxConfig(env: Env = process.env): OutboxConfig {
  const loopback = isLoopbackMode(env);
  const apiKey = present(env.RESEND_API_KEY);
  const from = present(env.RESEND_FROM) ?? (loopback ? "josecoded <avisos@example.com>" : null);
  const resendUrl = overrideUrl(env.RESEND_API_URL, loopback);
  const token = present(env.TELEGRAM_BOT_TOKEN);
  const telegramUrl = overrideUrl(env.TELEGRAM_API_URL, loopback);
  return {
    resend:
      apiKey && from && resendUrl !== false
        ? { apiKey, from, baseUrl: resendUrl ?? resendBaseUrl }
        : null,
    telegram:
      token && telegramUrl !== false ? { token, baseUrl: telegramUrl ?? telegramBaseUrl } : null,
  };
}

export function readCronSecret(env: Env = process.env): string | null {
  return present(env.CRON_SECRET);
}

export function readWebhookSecret(env: Env = process.env): string | null {
  return present(env.TELEGRAM_WEBHOOK_SECRET);
}
