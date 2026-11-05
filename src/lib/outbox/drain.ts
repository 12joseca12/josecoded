import { getTranslator } from "@/i18n/messages";
import type { ServiceSupabase } from "@/lib/supabase/service";
import {
  type DrainResult,
  type DrainSummary,
  type OutboxConfig,
  type OutboxItem,
  outboxItemSchema,
  type SendResult,
} from "@/types/outbox";

import { sendEmail, sendTelegram } from "./providers";
import { renderItem } from "./templates";

type Translators = Parameters<typeof renderItem>[1];

export const claimLimit = 10;
export const maxAttempts = 5;
export const sendTries = 2;
export const retryDelayMs = 400;
export const maxRetryAfterMs = 5000;

export interface DrainDeps {
  client: Pick<ServiceSupabase, "rpc">;
  config: OutboxConfig;
  origin: string;
  translators?: Translators;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

type Delivery = { ok: true } | { ok: false; error: string };

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function deliver(item: OutboxItem, deps: DrainDeps): Promise<Delivery> {
  const rendered = await renderItem(item, deps.translators ?? getTranslator, deps.origin);
  if (!rendered.ok) return { ok: false, error: rendered.reason };
  const { message } = rendered;
  const { resend, telegram } = deps.config;
  let send: (() => Promise<SendResult>) | null = null;
  if (message.channel === "email" && resend) {
    send = () => sendEmail(resend, message, `outbox-${item.id}`, deps.fetchImpl);
  } else if (message.channel === "telegram" && telegram) {
    send = () => sendTelegram(telegram, message.chatId, message.text, deps.fetchImpl);
  }
  if (send === null) return { ok: false, error: `${message.channel}_not_configured` };
  const sleep = deps.sleep ?? defaultSleep;

  for (let attempt = 1; ; attempt += 1) {
    const result = await send();
    if (result.ok) return { ok: true };
    const wait = result.retryAfterMs ?? retryDelayMs;
    if (!result.transient || attempt >= sendTries || wait > maxRetryAfterMs) {
      return { ok: false, error: result.error };
    }
    await sleep(wait);
  }
}

async function mark(deps: DrainDeps, id: number, delivery: Delivery): Promise<void> {
  try {
    await deps.client.rpc("outbox_mark", {
      p_id: id,
      p_ok: delivery.ok,
      ...(delivery.ok ? {} : { p_error: delivery.error }),
    });
  } catch {
    return;
  }
}

function idOf(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null) return null;
  const id = (raw as Record<string, unknown>).id;
  return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
}

export async function drainOutbox(deps: DrainDeps): Promise<DrainResult> {
  let rows: unknown[];
  try {
    const { data, error } = await deps.client.rpc("outbox_claim", { p_limit: claimLimit });
    if (error) return { status: "claim_failed" };
    rows = Array.isArray(data) ? data : [];
  } catch {
    return { status: "claim_failed" };
  }

  const summary: DrainSummary = { claimed: rows.length, sent: 0, retried: 0, failed: 0 };

  for (const raw of rows) {
    const parsed = outboxItemSchema.safeParse(raw);
    if (!parsed.success) {
      const id = idOf(raw);
      if (id !== null) {
        await mark(deps, id, { ok: false, error: "invalid_row" });
        summary.retried += 1;
      }
      continue;
    }
    const item = parsed.data;
    let delivery: Delivery;
    try {
      delivery = await deliver(item, deps);
    } catch {
      delivery = { ok: false, error: "delivery_exception" };
    }
    await mark(deps, item.id, delivery);
    if (delivery.ok) summary.sent += 1;
    else if (item.attempts + 1 >= maxAttempts) summary.failed += 1;
    else summary.retried += 1;
  }

  return { status: "done", ...summary };
}
