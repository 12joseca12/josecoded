import "@/lib/security/zod-jitless";

import { z } from "zod";

export const outboxChannels = ["email", "telegram"] as const;
export type OutboxChannel = (typeof outboxChannels)[number];

export const outboxTemplates = [
  "invitation",
  "lead_new",
  "notification",
  "test",
  "totp_reset",
] as const;
export type OutboxTemplate = (typeof outboxTemplates)[number];

const payloadSchema = z
  .unknown()
  .transform((value): Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {},
  );

export const outboxItemSchema = z.object({
  id: z.number().int().positive(),
  channel: z.enum(outboxChannels),
  recipient: z.string().min(1),
  template: z.string().min(1),
  payload: payloadSchema,
  attempts: z.number().int().nonnegative(),
});

export type OutboxItem = z.infer<typeof outboxItemSchema>;

export interface EmailMessage {
  channel: "email";
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface TelegramMessage {
  channel: "telegram";
  chatId: string;
  text: string;
}

export type OutboxMessage = EmailMessage | TelegramMessage;

export type RenderResult =
  | { ok: true; message: OutboxMessage }
  | { ok: false; reason: "unknown_template" | "payload_invalid" | "channel_not_supported" };

export type SendResult =
  { ok: true } | { ok: false; error: string; transient: boolean; retryAfterMs?: number };

export interface ResendConfig {
  apiKey: string;
  from: string;
  baseUrl: string;
}

export interface TelegramConfig {
  token: string;
  baseUrl: string;
}

export interface OutboxConfig {
  resend: ResendConfig | null;
  telegram: TelegramConfig | null;
}

export interface DrainSummary {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
}

export type DrainResult = ({ status: "done" } & DrainSummary) | { status: "claim_failed" };

export const telegramUpdateSchema = z.object({
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({ id: z.number().int(), type: z.string() }),
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

export type WebhookOutcome = "linked" | "invalid" | "taken" | "no_code" | "ignored";
