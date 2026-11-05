import { defaultLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import type { ServiceSupabase } from "@/lib/supabase/service";
import { type OutboxConfig, telegramUpdateSchema, type WebhookOutcome } from "@/types/outbox";

import { sendTelegram } from "./providers";

type Translators = typeof getTranslator;

const startPattern = /^\/start(?:@[A-Za-z0-9_]+)?(?:\s+(\S+))?$/;
const codePattern = /^[A-HJ-NP-Za-hj-np-z2-9]{6}$/;

export interface WebhookDeps {
  client: Pick<ServiceSupabase, "rpc">;
  config: OutboxConfig;
  reply: boolean;
  translators?: Translators;
  fetchImpl?: typeof fetch;
}

export function readStart(text: string | undefined): { code: string | null } | null {
  const match = startPattern.exec(text?.trim() ?? "");
  return match ? { code: match[1] ?? null } : null;
}

const replyKeys = {
  linked: "outbox.telegram.linked",
  invalid: "outbox.telegram.invalid",
  taken: "outbox.telegram.taken",
  no_code: "outbox.telegram.noCode",
} as const;

async function answer(
  deps: WebhookDeps,
  chatId: number,
  outcome: keyof typeof replyKeys,
): Promise<void> {
  if (!deps.reply || deps.config.telegram === null) return;
  const t = await (deps.translators ?? getTranslator)(defaultLocale);
  await sendTelegram(deps.config.telegram, String(chatId), t(replyKeys[outcome]), deps.fetchImpl);
}

export async function handleTelegramUpdate(
  raw: unknown,
  deps: WebhookDeps,
): Promise<WebhookOutcome> {
  const update = telegramUpdateSchema.safeParse(raw);
  const message = update.success ? update.data.message : undefined;
  if (message?.chat.type !== "private") return "ignored";
  const start = readStart(message.text);
  if (start === null) return "ignored";
  const chatId = message.chat.id;

  if (start.code === null) {
    await answer(deps, chatId, "no_code");
    return "no_code";
  }
  if (!codePattern.test(start.code)) {
    await answer(deps, chatId, "invalid");
    return "invalid";
  }

  const { error } = await deps.client.rpc("telegram_confirm_link", {
    p_code: start.code.toUpperCase(),
    p_chat_id: chatId,
  });
  if (error) {
    const outcome =
      error.message === "code_invalid_or_expired"
        ? "invalid"
        : error.message === "chat_already_linked"
          ? "taken"
          : null;
    if (outcome === null) throw new Error("telegram_confirm_failed");
    await answer(deps, chatId, outcome);
    return outcome;
  }
  await answer(deps, chatId, "linked");
  return "linked";
}
