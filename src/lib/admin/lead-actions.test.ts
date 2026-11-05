import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { mapLeadActionError, mapNewLeadError, runCreateLead, runLeadAction } from "./lead-actions";

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

function insertClient(result: { data?: unknown; error: unknown } | Error) {
  const single = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve({ data: null, ...result }),
  );
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { client: { from } as unknown as SupabaseClient<Database>, from, insert, select };
}

const newLead = {
  source: "manual",
  via: "hiring",
  fullName: "  Ana Prueba ",
  email: "ana@example.com",
  phone: null,
  organization: null,
  message: null,
  assignedTo: null,
};

describe("mapNewLeadError", () => {
  it("maps the assignee, the contact check, permissions and everything else", () => {
    expect(mapNewLeadError({ code: "P0001", message: "invalid_assignee" })).toEqual({
      status: "invalid",
      fields: ["assignedTo"],
    });
    expect(
      mapNewLeadError({ code: "23514", message: 'violates check constraint "leads_reachable"' }),
    ).toEqual({ status: "invalid", fields: ["email"] });
    expect(mapNewLeadError({ code: "42501", message: "row-level security" })).toEqual({
      status: "forbidden",
    });
    expect(mapNewLeadError({ code: "23514", message: "leads_phone_length" })).toEqual({
      status: "error",
    });
  });
});

describe("runCreateLead", () => {
  it("inserts with the user session and the allowed columns only", async () => {
    const { client, from, insert, select } = insertClient({ data: { id: leadId }, error: null });
    expect(await runCreateLead(client, newLead)).toEqual({ status: "done", id: leadId });
    expect(from).toHaveBeenCalledWith("leads");
    expect(insert).toHaveBeenCalledWith({
      source: "manual",
      via: "hiring",
      full_name: "Ana Prueba",
      email: "ana@example.com",
      phone: null,
      organization: null,
      message: null,
      assigned_to: null,
    });
    expect(select).toHaveBeenCalledWith("id");
  });

  it("rejects sources the form cannot create, missing contact data and unknown keys", async () => {
    const { client, insert } = insertClient({ data: { id: leadId }, error: null });
    expect(await runCreateLead(client, { ...newLead, source: "form" })).toEqual({
      status: "invalid",
      fields: [],
    });
    expect(await runCreateLead(client, { ...newLead, email: null })).toEqual({
      status: "invalid",
      fields: ["email"],
    });
    expect(await runCreateLead(client, { ...newLead, fullName: "  " })).toEqual({
      status: "invalid",
      fields: ["fullName"],
    });
    expect(await runCreateLead(client, { ...newLead, status: "converted" })).toEqual({
      status: "invalid",
      fields: [],
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("maps database errors and thrown requests", async () => {
    const bad = insertClient({ error: { code: "P0001", message: "invalid_assignee" } });
    expect(await runCreateLead(bad.client, newLead)).toEqual({
      status: "invalid",
      fields: ["assignedTo"],
    });
    const down = insertClient(new Error("network"));
    expect(await runCreateLead(down.client, newLead)).toEqual({ status: "error" });
  });
});
