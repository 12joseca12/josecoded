import { present } from "@/lib/contact/env";

type Env = Record<string, string | undefined>;

const botUsername = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export function isOutboxDrainOn(env: Env = process.env): boolean {
  return present(env.OUTBOX_DRAIN) === "on";
}

export function readBotUsername(env: Env = process.env): string | null {
  const value = present(env.TELEGRAM_BOT_USERNAME)?.replace(/^@/, "") ?? null;
  return value !== null && botUsername.test(value) ? value : null;
}

export function telegramStartUrl(username: string, code: string): string {
  return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
}
