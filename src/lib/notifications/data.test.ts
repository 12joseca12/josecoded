import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchPrefs,
  fetchTelegramStatus,
  mapNotificationError,
  mergePrefs,
  runPrefAction,
  runTelegramCode,
  runTelegramUnlink,
  runTestAction,
} from "./data";

interface Result {
  data: unknown;
  error: unknown;
}

function clientWith(result: Result) {
  const eq = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { from, rpc } as unknown as SupabaseClient<Database>, from, select, eq, rpc };
}

const userId = "10000000-0000-4000-8000-000000000001";

describe("mergePrefs", () => {
  it("defaults every channel on and applies the stored rows", () => {
    const matrix = mergePrefs([{ event: "lead_new", telegram: true, email: false, bell: true }]);
    expect(matrix.lead_new).toEqual({ telegram: true, email: false, bell: true });
    expect(matrix.omen_down).toEqual({ telegram: true, email: true, bell: true });
    expect(Object.keys(matrix)).toHaveLength(10);
  });
});

describe("fetchPrefs", () => {
  it("reads only the rows of the given user", async () => {
    const { client, from, select, eq } = clientWith({
      data: [{ event: "job_failed", telegram: false, email: true, bell: true }],
      error: null,
    });
    const result = await fetchPrefs(client, userId);
    expect(from).toHaveBeenCalledWith("notification_prefs");
    expect(select).toHaveBeenCalledWith("event, telegram, email, bell");
    expect(eq).toHaveBeenCalledWith("user_id", userId);
    expect(result.status === "ok" && result.data.job_failed.telegram).toBe(false);
  });

  it("tells a missing table from a failed read", async () => {
    const missing = clientWith({ data: null, error: { code: "PGRST205" } });
    expect(await fetchPrefs(missing.client, userId)).toEqual({ status: "unavailable" });
    const broken = clientWith({ data: null, error: { code: "XX000" } });
    expect(await fetchPrefs(broken.client, userId)).toEqual({ status: "error" });
    const odd = clientWith({ data: [{ event: "nope" }], error: null });
    expect(await fetchPrefs(odd.client, userId)).toEqual({ status: "error" });
  });
});

describe("fetchTelegramStatus", () => {
  it("maps the row to camel case", async () => {
    const { client, rpc } = clientWith({
      data: [
        { linked_at: null, pending_code: "AB23CD", pending_expires_at: "2026-11-05T10:15:00Z" },
      ],
      error: null,
    });
    expect(await fetchTelegramStatus(client)).toEqual({
      status: "ok",
      data: { linkedAt: null, code: "AB23CD", expiresAt: "2026-11-05T10:15:00Z" },
    });
    expect(rpc).toHaveBeenCalledWith("telegram_link_status");
  });

  it("reports unavailable when the function is not applied", async () => {
    const { client } = clientWith({ data: null, error: { code: "PGRST202" } });
    expect(await fetchTelegramStatus(client)).toEqual({ status: "unavailable" });
  });

  it("reports an error for an unreadable row", async () => {
    const { client } = clientWith({ data: [], error: null });
    expect(await fetchTelegramStatus(client)).toEqual({ status: "error" });
  });
});

describe("mapNotificationError", () => {
  it("maps forbidden, missing and the rest", () => {
    expect(mapNotificationError({ code: "42501" })).toBe("forbidden");
    expect(mapNotificationError({ code: "42883" })).toBe("unavailable");
    expect(mapNotificationError({ code: "P0001", message: "x" })).toBe("error");
  });
});

describe("runPrefAction", () => {
  it("validates the request before calling the database", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(await runPrefAction(client, { event: "x", channel: "email", enabled: true })).toEqual({
      status: "error",
    });
    expect(
      await runPrefAction(client, { event: "lead_new", channel: "sms", enabled: true }),
    ).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls set_notification_pref with the typed arguments", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(
      await runPrefAction(client, { event: "lead_new", channel: "bell", enabled: false }),
    ).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_notification_pref", {
      p_event: "lead_new",
      p_channel: "bell",
      p_enabled: false,
    });
  });

  it("reports a refused call", async () => {
    const { client } = clientWith({ data: null, error: { code: "42501", message: "forbidden" } });
    expect(
      await runPrefAction(client, { event: "lead_new", channel: "bell", enabled: false }),
    ).toEqual({ status: "forbidden" });
  });
});

describe("runTelegramCode and runTelegramUnlink", () => {
  it("returns the code and its expiry from the status", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: "AB23CD", error: null })
      .mockResolvedValueOnce({
        data: [
          { linked_at: null, pending_code: "AB23CD", pending_expires_at: "2026-11-05T10:15:00Z" },
        ],
        error: null,
      });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    expect(await runTelegramCode(client)).toEqual({
      status: "done",
      code: "AB23CD",
      expiresAt: "2026-11-05T10:15:00Z",
    });
  });

  it("rejects a code that is not six characters", async () => {
    const { client } = clientWith({ data: "short", error: null });
    expect(await runTelegramCode(client)).toEqual({ status: "error" });
  });

  it("unlinks and maps failures", async () => {
    const ok = clientWith({ data: null, error: null });
    expect(await runTelegramUnlink(ok.client)).toEqual({ status: "done" });
    const bad = clientWith({ data: null, error: { code: "42501" } });
    expect(await runTelegramUnlink(bad.client)).toEqual({ status: "forbidden" });
  });
});

describe("runTestAction", () => {
  it("queues a test for a valid channel", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(await runTestAction(client, { channel: "email" })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("send_test_notification", { p_channel: "email" });
  });

  it("rejects bell and unknown channels without calling the database", async () => {
    const { client, rpc } = clientWith({ data: null, error: null });
    expect(await runTestAction(client, { channel: "bell" })).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("says when Telegram is not linked", async () => {
    const { client } = clientWith({
      data: null,
      error: { code: "P0001", message: "telegram_not_linked" },
    });
    expect(await runTestAction(client, { channel: "telegram" })).toEqual({ status: "not_linked" });
  });
});
