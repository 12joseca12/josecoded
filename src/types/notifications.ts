import "@/lib/security/zod-jitless";

import { z } from "zod";

export const notificationEvents = [
  "lead_new",
  "lead_claimed",
  "message_new",
  "commission_accrued",
  "payment_recorded",
  "payment_overdue",
  "payout_paid",
  "job_failed",
  "omen_down",
  "invitation_accepted",
] as const;
export type NotificationEvent = (typeof notificationEvents)[number];

export const notificationChannels = ["telegram", "email", "bell"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const testChannels = ["telegram", "email"] as const;
export type TestChannel = (typeof testChannels)[number];

export const idleEvents: readonly NotificationEvent[] = ["message_new"];

export const closerEvents: readonly NotificationEvent[] = [
  "lead_claimed",
  "message_new",
  "commission_accrued",
  "payout_paid",
];

export type PrefRow = Record<NotificationChannel, boolean>;
export type PrefMatrix = Record<NotificationEvent, PrefRow>;

export const prefRowSchema = z.object({
  event: z.enum(notificationEvents),
  telegram: z.boolean(),
  email: z.boolean(),
  bell: z.boolean(),
});

export const prefActionSchema = z.strictObject({
  event: z.enum(notificationEvents),
  channel: z.enum(notificationChannels),
  enabled: z.boolean(),
});

export const testActionSchema = z.strictObject({ channel: z.enum(testChannels) });

export const telegramStatusSchema = z.object({
  linked_at: z.string().nullable(),
  pending_code: z.string().nullable(),
  pending_expires_at: z.string().nullable(),
});

export interface TelegramStatus {
  linkedAt: string | null;
  code: string | null;
  expiresAt: string | null;
}

export type NotificationSource<T> =
  { status: "ok"; data: T } | { status: "unavailable" } | { status: "error" };

export type NotificationFailure = "forbidden" | "unavailable" | "error";

export type PrefActionResult = { status: "done" } | { status: NotificationFailure };

export type TelegramCodeResult =
  { status: "done"; code: string; expiresAt: string | null } | { status: NotificationFailure };

export type TelegramUnlinkResult = { status: "done" } | { status: NotificationFailure };

export type TestActionResult =
  { status: "done" } | { status: "not_linked" } | { status: NotificationFailure };

export type PrefHandler = (raw: unknown) => Promise<PrefActionResult>;
export type TelegramCodeHandler = () => Promise<TelegramCodeResult>;
export type TelegramUnlinkHandler = () => Promise<TelegramUnlinkResult>;
export type TestHandler = (raw: unknown) => Promise<TestActionResult>;

export interface TelegramLinkLabels {
  title: string;
  text: string;
  linked: string;
  unlinked: string;
  noBot: { title: string; text: string };
  generate: string;
  generating: string;
  codeTitle: string;
  codeHelp: string;
  open: string;
  check: string;
  checking: string;
  stillPending: string;
  unlink: string;
  unlinking: string;
  confirmUnlink: string;
  confirmYes: string;
  confirmNo: string;
  done: Record<"linked" | "unlinked", string>;
  errors: Record<NotificationFailure, string>;
}

export interface RuleMatrixLabels {
  region: string;
  caption: string;
  event: string;
  channels: Record<NotificationChannel, string>;
  events: Record<NotificationEvent, string>;
  idle: string;
  telegramNote: string;
  saved: string;
  errors: Record<NotificationFailure, string>;
}

export interface TestSenderLabels {
  title: string;
  text: string;
  send: Record<TestChannel, string>;
  sending: string;
  done: Record<TestChannel, string>;
  needsTelegram: string;
  errors: Record<NotificationFailure, string>;
}
