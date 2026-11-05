import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { mapLeadActionError, runLeadAction } from "./lead-actions";

const leadId = "10000000-0000-4000-8000-000000000003";
const userId = "00000000-0000-4000-8000-0000000000c1";

function clientWith(result: { error: unknown } | Error) {
  const rpc = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve({ data: null, ...result }),
  );
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("mapLeadActionError", () => {
  it("maps stale rows, bad input, permissions and everything else", () => {
    for (const message of [
      "lead_already_claimed",
      "lead_discarded",
      "lead_not_discardable",
      "lead_not_found",
    ]) {
      expect(mapLeadActionError({ code: "P0001", message })).toEqual({ status: "stale" });
    }
    expect(mapLeadActionError({ code: "P0001", message: "invalid_assignee" })).toEqual({
      status: "invalid",
      field: "assignee",
    });
    expect(mapLeadActionError({ code: "P0001", message: "reason_required" })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(mapLeadActionError({ code: "P0001", message: "reason_too_long" })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(mapLeadActionError({ code: "42501", message: "admin_only" })).toEqual({
      status: "forbidden",
    });
    expect(mapLeadActionError({ code: "P0001", message: "contact_conflict" })).toEqual({
      status: "error",
    });
    expect(mapLeadActionError({})).toEqual({ status: "error" });
  });
});

describe("runLeadAction", () => {
  it("assigns through the rpc with the user session", async () => {
    const { client, rpc } = clientWith({ error: null });
    expect(await runLeadAction(client, "assign", { leadId, userId })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("assign_lead", { p_lead_id: leadId, p_user_id: userId });
  });

  it("discards with the trimmed reason", async () => {
    const { client, rpc } = clientWith({ error: null });
    expect(await runLeadAction(client, "discard", { leadId, reason: "  Fuera de rango " })).toEqual(
      { status: "done" },
    );
    expect(rpc).toHaveBeenCalledWith("discard_lead", {
      p_lead_id: leadId,
      p_reason: "Fuera de rango",
    });
  });

  it("rejects malformed input without calling the database", async () => {
    const { client, rpc } = clientWith({ error: null });
    expect(await runLeadAction(client, "assign", { leadId, userId: "nope" })).toEqual({
      status: "invalid",
      field: "assignee",
    });
    expect(await runLeadAction(client, "assign", null)).toEqual({
      status: "invalid",
      field: "assignee",
    });
    expect(await runLeadAction(client, "discard", { leadId, reason: "   " })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(await runLeadAction(client, "discard", { leadId, reason: "x".repeat(501) })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps database errors and thrown requests", async () => {
    const lost = clientWith({ error: { code: "P0001", message: "lead_already_claimed" } });
    expect(await runLeadAction(lost.client, "assign", { leadId, userId })).toEqual({
      status: "stale",
    });
    const down = clientWith(new Error("network"));
    expect(await runLeadAction(down.client, "discard", { leadId, reason: "x" })).toEqual({
      status: "error",
    });
  });
});
