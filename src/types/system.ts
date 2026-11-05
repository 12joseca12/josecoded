import "@/lib/security/zod-jitless";

import { z } from "zod";

import type { SettingGroup, SettingKey, SettingView } from "@/lib/settings/definitions";

export const jobStatuses = ["queued", "running", "done", "failed", "cancelled"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const jobKinds = [
  "chat.reply",
  "chat.summary",
  "rag.index",
  "radar.scan",
  "radar.score",
  "radar.draft",
  "radar.send",
  "account.delete",
  "notify.send",
] as const;
export type JobKind = (typeof jobKinds)[number];

export const jobsLimit = 100;

export const omenStatusSchema = z.object({
  seen_at: z.string().nullable(),
  version: z.string().nullable(),
  models: z
    .array(z.unknown())
    .transform((list) => list.filter((entry): entry is string => typeof entry === "string")),
  queued: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export type OmenStatusData = z.infer<typeof omenStatusSchema>;

export const jobRowSchema = z.object({
  id: z.uuid(),
  kind: z.enum(jobKinds),
  status: z.enum(jobStatuses),
  attempts: z.number().int().nonnegative(),
  max_attempts: z.number().int().positive(),
  run_after: z.string(),
  error: z.string().nullable(),
  created_at: z.string(),
  finished_at: z.string().nullable(),
});

export type JobRow = z.infer<typeof jobRowSchema>;

export const settingRowSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updated_at: z.string(),
});

export type SystemSource<T> =
  { status: "ok"; data: T } | { status: "unavailable" } | { status: "error" };

export const jobActionSchema = z.strictObject({ jobId: z.uuid() });

export type SettingActionResult =
  | { status: "done"; updatedAt: string | null }
  | { status: "invalid" }
  | { status: "forbidden" }
  | { status: "unavailable" }
  | { status: "error" };

export type JobActionResult =
  { status: "done" } | { status: "stale" } | { status: "forbidden" } | { status: "error" };

export type SettingSaveHandler = (raw: unknown) => Promise<SettingActionResult>;
export type JobActionHandler = (raw: unknown) => Promise<JobActionResult>;

export type OmenTone = "live" | "slow" | "down" | "none";

export interface OmenSummary {
  tone: OmenTone;
  ageMinutes: number | null;
}

export interface SettingItemLabels {
  name: string;
  hint: string;
}

export interface SettingRowLabels {
  on: string;
  off: string;
  save: string;
  saving: string;
  saved: string;
  updatedAt: string;
  neverSaved: string;
  wired: string;
  notWired: string;
  maintenanceUntil: string;
  unit: Record<"hours" | "delay" | "vat", string>;
  cadence: Record<"per_payment" | "weekly" | "biweekly", string>;
  errors: Record<"invalid" | "forbidden" | "unavailable" | "error", string>;
}

export interface SwitchListLabels {
  region: string;
  groups: Record<SettingGroup, { title: string; text: string }>;
  items: Record<SettingKey, SettingItemLabels>;
  row: SettingRowLabels;
}

export interface SwitchListProps {
  settings: SettingView[];
  labels: SwitchListLabels;
  locale: string;
  save: SettingSaveHandler;
  readOnly: boolean;
}

export interface OmenStatusLabels {
  title: string;
  tone: Record<OmenTone, string>;
  bandNone: string;
  bandDown: string;
  seen: string;
  seenNever: string;
  version: string;
  versionNone: string;
  models: string;
  modelsNone: string;
  queue: Record<"queued" | "running" | "failed", string>;
  minutes: string;
  unavailable: string;
}

export interface JobTableLabels {
  region: string;
  caption: string;
  filterLabel: string;
  filters: Record<"all" | JobStatus, string>;
  columns: Record<"kind" | "status" | "attempts" | "runAfter" | "error" | "actions", string>;
  kinds: Record<JobKind, string>;
  status: Record<JobStatus, string>;
  noError: string;
  errorMore: string;
  retry: string;
  retrying: string;
  cancel: string;
  cancelling: string;
  confirmRetry: string;
  confirmCancel: string;
  confirmYes: string;
  confirmNo: string;
  done: Record<"retry" | "cancel", string>;
  errors: Record<"stale" | "forbidden" | "error", string>;
}
