import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchJobs,
  fetchOmenStatus,
  fetchSettings,
  isMissingObject,
  mapJobError,
  mapSettingError,
  parseJobFilter,
  runJobAction,
  runSettingAction,
  summarizeOmen,
} from "./system";

interface Result {
  data: unknown;
  error: unknown;
}

function clientWith(result: Result) {
  const order = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  const rpc = vi.fn().mockResolvedValue(result);
  return {
    client: { from, rpc } as unknown as SupabaseClient<Database>,
    from,
    select,
    order,
    rpc,
  };
}

const jobId = "50000000-0000-4000-8000-000000000002";

const job = {
  id: jobId,
  kind: "radar.scan",
  status: "failed",
  attempts: 3,
  max_attempts: 3,
  run_after: "2026-11-05T10:00:00+00:00",
  error: "timeout",
  created_at: "2026-11-05T09:00:00+00:00",
  finished_at: "2026-11-05T10:01:00+00:00",
};

const omen = {
  seen_at: "2026-11-05T12:00:00+00:00",
  version: "1.0.0",
  models: ["qwen", 3, "llama"],
  queued: 1,
  running: 0,
  failed: 2,
};

describe("isMissingObject", () => {
  it("recognises a function or a table that is not applied yet", () => {
    expect(isMissingObject({ code: "PGRST202" })).toBe(true);
    expect(isMissingObject({ code: "PGRST205" })).toBe(true);
    expect(isMissingObject({ code: "42P01" })).toBe(true);
    expect(isMissingObject({ code: "42501" })).toBe(false);
    expect(isMissingObject({})).toBe(false);
  });
});

describe("fetchSettings", () => {
  it("reads the settings ordered by key", async () => {
    const rows = [{ key: "blog", value: true, updated_at: "2026-11-05T10:00:00+00:00" }];
    const { client, from, select, order } = clientWith({ data: rows, error: null });
    expect(await fetchSettings(client)).toEqual({ status: "ok", data: rows });
    expect(from).toHaveBeenCalledWith("site_settings");
    expect(select).toHaveBeenCalledWith("key, value, updated_at");
    expect(order).toHaveBeenCalledWith("key");
  });

  it("reports a table that is not in the database yet as unavailable", async () => {
    const { client } = clientWith({ data: null, error: { code: "PGRST205", message: "no table" } });
    expect(await fetchSettings(client)).toEqual({ status: "unavailable" });
  });

  it("reports any other failure as an error", async () => {
    const { client } = clientWith({ data: null, error: { code: "XX000", message: "boom" } });
    expect(await fetchSettings(client)).toEqual({ status: "error" });
    const malformed = clientWith({ data: [{ key: 1 }], error: null });
    expect(await fetchSettings(malformed.client)).toEqual({ status: "error" });
  });
});

describe("fetchOmenStatus", () => {
  it("parses the status and keeps only the models that are text", async () => {
    const { client, rpc } = clientWith({ data: omen, error: null });
    const result = await fetchOmenStatus(client);
    expect(rpc).toHaveBeenCalledWith("omen_status");
    expect(result).toEqual({ status: "ok", data: { ...omen, models: ["qwen", "llama"] } });
  });

  it("accepts a status without a heartbeat", async () => {
    const empty = { ...omen, seen_at: null, version: null, models: [] };
    const { client } = clientWith({ data: empty, error: null });
    expect(await fetchOmenStatus(client)).toEqual({ status: "ok", data: empty });
  });

  it("reports a missing function as unavailable and a thrown call as an error", async () => {
    const missing = clientWith({ data: null, error: { code: "PGRST202", message: "no function" } });
    expect(await fetchOmenStatus(missing.client)).toEqual({ status: "unavailable" });
    const thrown = clientWith({ data: null, error: null });
    thrown.rpc.mockRejectedValue(new Error("down"));
    expect(await fetchOmenStatus(thrown.client)).toEqual({ status: "error" });
  });
});

describe("fetchJobs", () => {
  it("asks for the capped list, filtered only when a status is given", async () => {
    const { client, rpc } = clientWith({ data: [job], error: null });
    expect(await fetchJobs(client, null)).toEqual({ status: "ok", data: [job] });
    expect(rpc).toHaveBeenLastCalledWith("admin_jobs", { p_limit: 100 });
    await fetchJobs(client, "failed");
    expect(rpc).toHaveBeenLastCalledWith("admin_jobs", { p_limit: 100, p_status: "failed" });
  });

  it("reports a missing function as unavailable and unknown kinds as an error", async () => {
    const missing = clientWith({ data: null, error: { code: "PGRST202", message: "no function" } });
    expect(await fetchJobs(missing.client, null)).toEqual({ status: "unavailable" });
    const odd = clientWith({ data: [{ ...job, kind: "made.up" }], error: null });
    expect(await fetchJobs(odd.client, null)).toEqual({ status: "error" });
  });
});

describe("summarizeOmen", () => {
  const now = new Date("2026-11-05T12:00:00+00:00");

  it("is live under two minutes, slow under ten and down after that", () => {
    const at = (minutes: number) => ({
      ...omen,
      models: [],
      seen_at: new Date(now.getTime() - minutes * 60_000).toISOString(),
    });
    expect(summarizeOmen(at(0), now)).toEqual({ tone: "live", ageMinutes: 0 });
    expect(summarizeOmen(at(1), now)).toEqual({ tone: "live", ageMinutes: 1 });
    expect(summarizeOmen(at(2), now)).toEqual({ tone: "slow", ageMinutes: 2 });
    expect(summarizeOmen(at(9), now)).toEqual({ tone: "slow", ageMinutes: 9 });
    expect(summarizeOmen(at(10), now)).toEqual({ tone: "down", ageMinutes: 10 });
  });

  it("has no signal without a heartbeat, a status or a valid date", () => {
    expect(summarizeOmen(null, now)).toEqual({ tone: "none", ageMinutes: null });
    expect(summarizeOmen({ ...omen, models: [], seen_at: null }, now)).toEqual({
      tone: "none",
      ageMinutes: null,
    });
    expect(summarizeOmen({ ...omen, models: [], seen_at: "garbage" }, now).tone).toBe("none");
  });

  it("never reports a negative age when the clocks disagree", () => {
    const future = { ...omen, models: [], seen_at: "2026-11-05T12:05:00+00:00" };
    expect(summarizeOmen(future, now)).toEqual({ tone: "live", ageMinutes: 0 });
  });
});

describe("parseJobFilter", () => {
  it("accepts a known status and drops everything else", () => {
    expect(parseJobFilter("failed")).toBe("failed");
    expect(parseJobFilter(["queued", "done"])).toBe("queued");
    expect(parseJobFilter("bogus")).toBeNull();
    expect(parseJobFilter(undefined)).toBeNull();
  });
});

describe("runSettingAction", () => {
  it("validates the value for the key before calling Supabase", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(await runSettingAction(client, { key: "blog", value: "yes" })).toEqual({
      status: "invalid",
    });
    expect(await runSettingAction(client, { key: "made.up", value: true })).toEqual({
      status: "invalid",
    });
    expect(await runSettingAction(client, "nope")).toEqual({ status: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("saves through set_setting and returns the new timestamp", async () => {
    const { client, rpc } = clientWith({ data: "2026-11-05T12:00:00+00:00", error: null });
    expect(await runSettingAction(client, { key: "blog", value: false })).toEqual({
      status: "done",
      updatedAt: "2026-11-05T12:00:00+00:00",
    });
    expect(rpc).toHaveBeenCalledWith("set_setting", { p_key: "blog", p_value: false });
  });

  it("maps the typed errors", () => {
    expect(mapSettingError({ code: "P0001", message: "setting_value_invalid" })).toEqual({
      status: "invalid",
    });
    expect(mapSettingError({ code: "P0001", message: "setting_key_not_allowed" })).toEqual({
      status: "invalid",
    });
    expect(mapSettingError({ code: "42501", message: "forbidden" })).toEqual({
      status: "forbidden",
    });
    expect(mapSettingError({ code: "PGRST202", message: "x" })).toEqual({ status: "unavailable" });
    expect(mapSettingError({ code: "XX000", message: "x" })).toEqual({ status: "error" });
  });

  it("reports a thrown call as an error", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    rpc.mockRejectedValue(new Error("down"));
    expect(await runSettingAction(client, { key: "blog", value: false })).toEqual({
      status: "error",
    });
  });
});

describe("runJobAction", () => {
  it("rejects an id that is not a uuid without calling Supabase", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(await runJobAction(client, "retry", { jobId: "nope" })).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls retry_job and cancel_job with the id", async () => {
    const { client, rpc } = clientWith({ data: "queued", error: null });
    expect(await runJobAction(client, "retry", { jobId })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenLastCalledWith("retry_job", { p_id: jobId });
    expect(await runJobAction(client, "cancel", { jobId })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenLastCalledWith("cancel_job", { p_id: jobId });
  });

  it("maps a job that already changed to stale and a missing role to forbidden", () => {
    expect(mapJobError({ code: "P0001", message: "job_not_retryable" })).toEqual({
      status: "stale",
    });
    expect(mapJobError({ code: "P0001", message: "job_not_cancellable" })).toEqual({
      status: "stale",
    });
    expect(mapJobError({ code: "P0001", message: "job_not_found" })).toEqual({ status: "stale" });
    expect(mapJobError({ code: "42501", message: "forbidden" })).toEqual({ status: "forbidden" });
    expect(mapJobError({ code: "XX000", message: "x" })).toEqual({ status: "error" });
  });
});
