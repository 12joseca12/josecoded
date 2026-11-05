import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  parseSettingValue,
  saveSettingSchema,
  type SettingRowData,
} from "@/lib/settings/definitions";
import type { Database, Json } from "@/types/database";
import {
  type JobActionResult,
  jobActionSchema,
  type JobRow,
  jobRowSchema,
  jobsLimit,
  type JobStatus,
  type OmenStatusData,
  omenStatusSchema,
  type OmenSummary,
  type SettingActionResult,
  settingRowSchema,
  type SystemSource,
} from "@/types/system";

export interface SystemError {
  code?: string | null;
  message?: string | null;
}

const missingCodes = new Set(["PGRST202", "PGRST205", "42883", "42P01"]);
const liveMinutes = 2;
const slowMinutes = 10;

export function isMissingObject(error: SystemError): boolean {
  return missingCodes.has(error.code ?? "");
}

function failure<T>(error: SystemError): SystemSource<T> {
  return isMissingObject(error) ? { status: "unavailable" } : { status: "error" };
}

const settingRowsSchema = z.array(settingRowSchema);
const jobRowsSchema = z.array(jobRowSchema);

export async function fetchSettings(
  client: SupabaseClient<Database>,
): Promise<SystemSource<SettingRowData[]>> {
  try {
    const { data, error } = await client
      .from("site_settings")
      .select("key, value, updated_at")
      .order("key");
    if (error) return failure(error);
    const rows = settingRowsSchema.safeParse(data);
    return rows.success ? { status: "ok", data: rows.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function fetchOmenStatus(
  client: SupabaseClient<Database>,
): Promise<SystemSource<OmenStatusData>> {
  try {
    const { data, error } = await client.rpc("omen_status");
    if (error) return failure(error);
    const status = omenStatusSchema.safeParse(data);
    return status.success ? { status: "ok", data: status.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function fetchJobs(
  client: SupabaseClient<Database>,
  status: JobStatus | null,
): Promise<SystemSource<JobRow[]>> {
  try {
    const { data, error } = await client.rpc("admin_jobs", {
      p_limit: jobsLimit,
      ...(status ? { p_status: status } : {}),
    });
    if (error) return failure(error);
    const rows = jobRowsSchema.safeParse(data);
    return rows.success ? { status: "ok", data: rows.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export function summarizeOmen(status: OmenStatusData | null, now: Date): OmenSummary {
  if (!status?.seen_at) return { tone: "none", ageMinutes: null };
  const seen = new Date(status.seen_at).getTime();
  if (Number.isNaN(seen)) return { tone: "none", ageMinutes: null };
  const ageMinutes = Math.max(0, Math.floor((now.getTime() - seen) / 60_000));
  if (ageMinutes < liveMinutes) return { tone: "live", ageMinutes };
  if (ageMinutes < slowMinutes) return { tone: "slow", ageMinutes };
  return { tone: "down", ageMinutes };
}

export function parseJobFilter(raw: string | string[] | undefined): JobStatus | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = jobRowSchema.shape.status.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const invalidMessages = new Set(["setting_key_not_allowed", "setting_value_invalid"]);

export function mapSettingError(error: SystemError): SettingActionResult {
  if (invalidMessages.has(error.message ?? "")) return { status: "invalid" };
  if (error.code === "42501") return { status: "forbidden" };
  if (isMissingObject(error)) return { status: "unavailable" };
  return { status: "error" };
}

export async function runSettingAction(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<SettingActionResult> {
  const request = saveSettingSchema.safeParse(raw);
  if (!request.success) return { status: "invalid" };
  const value = parseSettingValue(request.data.key, request.data.value);
  if (value === undefined) return { status: "invalid" };
  try {
    const { data, error } = await client.rpc("set_setting", {
      p_key: request.data.key,
      p_value: value as Json,
    });
    if (error) return mapSettingError(error);
    return { status: "done", updatedAt: typeof data === "string" ? data : null };
  } catch {
    return { status: "error" };
  }
}

const staleMessages = new Set(["job_not_found", "job_not_retryable", "job_not_cancellable"]);

export function mapJobError(error: SystemError): JobActionResult {
  if (staleMessages.has(error.message ?? "")) return { status: "stale" };
  if (error.code === "42501") return { status: "forbidden" };
  return { status: "error" };
}

export async function runJobAction(
  client: SupabaseClient<Database>,
  kind: "retry" | "cancel",
  raw: unknown,
): Promise<JobActionResult> {
  const request = jobActionSchema.safeParse(raw);
  if (!request.success) return { status: "error" };
  try {
    const { error } =
      kind === "retry"
        ? await client.rpc("retry_job", { p_id: request.data.jobId })
        : await client.rpc("cancel_job", { p_id: request.data.jobId });
    return error ? mapJobError(error) : { status: "done" };
  } catch {
    return { status: "error" };
  }
}
