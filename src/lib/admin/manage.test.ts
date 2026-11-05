import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  mapManageError,
  runHistory,
  runReassign,
  runResetTotp,
  runSetActive,
  runSetRates,
  summarizeAudit,
} from "./manage";

const userId = "00000000-0000-4000-8000-0000000000c1";
const otherId = "00000000-0000-4000-8000-0000000000c2";
const actorId = "00000000-0000-4000-8000-0000000000a2";

interface Reply {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

function clientWith(replies: Record<string, Reply | Error>) {
  const rpc = vi.fn((name: string) => {
    const reply = replies[name] ?? { data: null, error: null };
    return reply instanceof Error
      ? Promise.reject(reply)
      : Promise.resolve({ error: null, ...reply });
  });
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const rates = {
  userId,
  closerRate: "10",
  parentRate: "",
  closerRecurringRate: "5,5",
  parentRecurringRate: "",
  payoutCadence: "weekly",
};

describe("mapManageError", () => {
  it("keeps typed errors and hides the rest", () => {
    expect(mapManageError({ code: "23514", message: "closer_has_subclosers" })).toBe(
      "closer_has_subclosers",
    );
    expect(mapManageError({ code: "23514", message: "last_admin_required" })).toBe(
      "last_admin_required",
    );
    expect(mapManageError({ code: "42501", message: "forbidden" })).toBe("forbidden");
    expect(mapManageError({ code: "42501", message: "other" })).toBe("forbidden");
    expect(mapManageError({ code: "XX000", message: "boom" })).toBe("error");
  });
});

describe("runSetRates", () => {
  it("replaces the rates with the normalized values", async () => {
    const { client, rpc } = clientWith({});
    expect(await runSetRates(client, rates)).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_user_rates", {
      p_user_id: userId,
      p_closer_rate: 10,
      p_parent_rate: undefined,
      p_closer_recurring_rate: 5.5,
      p_parent_recurring_rate: undefined,
      p_payout_cadence: "weekly",
    });
  });

  it.each([
    [{ closerRate: "101" }, "closerRate"],
    [{ closerRate: "x" }, "closerRate"],
    [{ closerRecurringRate: "10" }, "closerRecurringRate"],
    [{ parentRate: "5", parentRecurringRate: "5" }, "parentRecurringRate"],
    [{ payoutCadence: "daily" }, "payoutCadence"],
    [{ userId: "nope" }, "userId"],
  ])("rejects %j before calling Supabase", async (patch, field) => {
    const { client, rpc } = clientWith({});
    expect(await runSetRates(client, { ...rates, ...patch })).toEqual({ status: "invalid", field });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces typed database errors", async () => {
    const { client } = clientWith({
      set_user_rates: { error: { code: "P0001", message: "rates_recurring_not_lower" } },
    });
    expect(await runSetRates(client, rates)).toEqual({
      status: "error",
      code: "rates_recurring_not_lower",
    });
  });
});

describe("runSetActive", () => {
  it("toggles and maps the guard errors", async () => {
    const ok = clientWith({});
    expect(await runSetActive(ok.client, { userId, active: false })).toEqual({ status: "done" });
    expect(ok.rpc).toHaveBeenCalledWith("set_user_active", { p_user_id: userId, p_active: false });
    const blocked = clientWith({
      set_user_active: { error: { code: "23514", message: "closer_has_subclosers" } },
    });
    expect(await runSetActive(blocked.client, { userId, active: false })).toEqual({
      status: "error",
      code: "closer_has_subclosers",
    });
    expect(await runSetActive(ok.client, { userId, active: "no" })).toEqual({
      status: "invalid",
      field: "userId",
    });
  });
});

describe("runReassign", () => {
  it("returns the moved counts", async () => {
    const { client, rpc } = clientWith({
      reassign_portfolio: { data: [{ contacts: 3, deals: 2, leads: 1 }] },
    });
    expect(await runReassign(client, { fromUserId: userId, toUserId: otherId })).toEqual({
      status: "done",
      contacts: 3,
      deals: 2,
      leads: 1,
    });
    expect(rpc).toHaveBeenCalledWith("reassign_portfolio", {
      p_from_user: userId,
      p_to_user: otherId,
    });
  });

  it("maps errors and malformed replies", async () => {
    const conflict = clientWith({
      reassign_portfolio: { error: { code: "P0001", message: "contact_email_conflict" } },
    });
    expect(await runReassign(conflict.client, { fromUserId: userId, toUserId: otherId })).toEqual({
      status: "error",
      code: "contact_email_conflict",
    });
    const empty = clientWith({ reassign_portfolio: { data: [] } });
    expect(await runReassign(empty.client, { fromUserId: userId, toUserId: otherId })).toEqual({
      status: "error",
      code: "error",
    });
    expect(await runReassign(empty.client, { fromUserId: userId })).toEqual({
      status: "error",
      code: "invalid_assignee",
    });
  });
});

describe("runResetTotp", () => {
  function deps(overrides: Partial<Parameters<typeof runResetTotp>[0]> = {}) {
    const { client, rpc } = clientWith({});
    const deleteFactor = vi.fn(() => Promise.resolve(true));
    const listFactorIds = vi.fn(() => Promise.resolve(["f1", "f2"]));
    return {
      rpc,
      deleteFactor,
      listFactorIds,
      deps: { client, actorId, listFactorIds, deleteFactor, ...overrides },
    };
  }

  it("deletes every factor and then logs the reset", async () => {
    const { deps: value, rpc, deleteFactor } = deps();
    expect(await runResetTotp(value, { userId })).toEqual({ status: "done" });
    expect(deleteFactor.mock.calls).toEqual([
      [userId, "f1"],
      [userId, "f2"],
    ]);
    expect(rpc).toHaveBeenCalledWith("log_totp_reset", { p_user_id: userId });
  });

  it("refuses to reset the actor itself", async () => {
    const { deps: value, listFactorIds } = deps();
    expect(await runResetTotp(value, { userId: actorId })).toEqual({
      status: "error",
      code: "cannot_reset_self",
    });
    expect(listFactorIds).not.toHaveBeenCalled();
  });

  it("logs nothing when the factors cannot be read or deleted", async () => {
    const unreadable = deps({ listFactorIds: () => Promise.resolve(null) });
    expect(await runResetTotp(unreadable.deps, { userId })).toEqual({
      status: "error",
      code: "unavailable",
    });
    const stuck = deps({ deleteFactor: () => Promise.resolve(false) });
    expect(await runResetTotp(stuck.deps, { userId })).toEqual({
      status: "error",
      code: "unavailable",
    });
    expect(unreadable.rpc).not.toHaveBeenCalled();
    expect(stuck.rpc).not.toHaveBeenCalled();
  });

  it("reports an unlogged reset when the audit call fails", async () => {
    const { client } = clientWith({ log_totp_reset: { error: { message: "boom" } } });
    const value = {
      client,
      actorId,
      listFactorIds: () => Promise.resolve([]),
      deleteFactor: () => Promise.resolve(true),
    };
    expect(await runResetTotp(value, { userId })).toEqual({ status: "error", code: "unlogged" });
    expect(await runResetTotp(value, { userId: "bad" })).toEqual({
      status: "invalid",
      field: "userId",
    });
  });
});

describe("summarizeAudit", () => {
  const base = { id: 1, at: "2026-11-05T10:00:00Z", actor_name: "Jose" };
  const out = { id: 1, at: "2026-11-05T10:00:00Z", actor: "Jose" };

  it("lists only the watched fields that changed", () => {
    expect(
      summarizeAudit({
        ...base,
        action: "update",
        before: { closer_rate: 10, is_active: true, full_name: "A", updated_at: "x" },
        after: { closer_rate: 12.5, is_active: false, full_name: "B", updated_at: "y" },
      }),
    ).toEqual({
      ...out,
      kind: "update",
      changes: [
        { field: "closer_rate", before: "10", after: "12.5" },
        { field: "is_active", before: "true", after: "false" },
      ],
    });
  });

  it("recognizes inserts and TOTP resets and skips noise", () => {
    expect(summarizeAudit({ ...base, action: "insert", before: null, after: {} })).toEqual({
      ...out,
      kind: "insert",
      changes: [],
    });
    expect(
      summarizeAudit({ ...base, action: "update", before: null, after: { totp_reset: true } }),
    ).toEqual({ ...out, kind: "totp_reset", changes: [] });
    expect(
      summarizeAudit({ ...base, action: "claim_quota_reached", before: null, after: {} }),
    ).toBeNull();
    expect(
      summarizeAudit({
        ...base,
        action: "update",
        before: { role: "closer" },
        after: { role: "closer" },
      }),
    ).toBeNull();
  });
});

describe("runHistory", () => {
  it("returns the readable entries", async () => {
    const { client, rpc } = clientWith({
      admin_audit_log: {
        data: [
          {
            id: 2,
            at: "2026-11-05T10:00:00Z",
            actor_name: null,
            action: "update",
            before: { is_active: true },
            after: { is_active: false },
          },
          {
            id: 1,
            at: "x",
            actor_name: null,
            action: "claim_quota_reached",
            before: null,
            after: {},
          },
        ],
      },
    });
    const result = await runHistory(client, { userId });
    expect(result).toEqual({
      status: "ok",
      entries: [
        {
          id: 2,
          at: "2026-11-05T10:00:00Z",
          actor: null,
          kind: "update",
          changes: [{ field: "is_active", before: "true", after: "false" }],
        },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("admin_audit_log", {
      p_table: "profiles",
      p_row_id: userId,
      p_limit: 30,
    });
  });

  it("fails on errors, malformed rows and bad ids", async () => {
    expect(
      await runHistory(clientWith({ admin_audit_log: { error: { message: "x" } } }).client, {
        userId,
      }),
    ).toEqual({ status: "error" });
    expect(
      await runHistory(clientWith({ admin_audit_log: { data: [{ id: "x" }] } }).client, { userId }),
    ).toEqual({ status: "error" });
    expect(await runHistory(clientWith({}).client, { userId: "bad" })).toEqual({
      status: "error",
    });
  });
});
