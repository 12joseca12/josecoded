import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { mapClaimError, runClaimLead } from "./inbox-actions";

const leadId = "10000000-0000-4000-8000-000000000003";
const contactId = "20000000-0000-4000-8000-0000000000f1";

function clientWith(result: { data?: unknown; error?: unknown } | Error) {
  const rpc = vi.fn(() =>
    result instanceof Error
      ? Promise.reject(result)
      : Promise.resolve({ data: null, error: null, ...result }),
  );
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("mapClaimError", () => {
  it("types the claim failures", () => {
    expect(mapClaimError({ code: "P0001", message: "lead_already_claimed" })).toEqual({
      status: "stale",
    });
    expect(mapClaimError({ code: "P0001", message: "claim_quota_exceeded" })).toEqual({
      status: "quota",
    });
    expect(mapClaimError({ code: "42501", message: "forbidden" })).toEqual({
      status: "forbidden",
    });
    expect(mapClaimError({ code: "P0001", message: "contact_conflict" })).toEqual({
      status: "error",
    });
    expect(mapClaimError({})).toEqual({ status: "error" });
  });
});

describe("runClaimLead", () => {
  it("claims through the RPC and returns the new contact", async () => {
    const { client, rpc } = clientWith({ data: contactId });
    expect(await runClaimLead(client, { leadId })).toEqual({ status: "done", contactId });
    expect(rpc).toHaveBeenCalledWith("claim_lead", { p_lead_id: leadId });
  });

  it("reports the hand-off to the admin when no contact comes back", async () => {
    const { client } = clientWith({ data: null });
    expect(await runClaimLead(client, { leadId })).toEqual({ status: "handoff" });
  });

  it("rejects malformed input before calling the database", async () => {
    const { client, rpc } = clientWith({ data: contactId });
    expect(await runClaimLead(client, { leadId: "nope" })).toEqual({ status: "error" });
    expect(await runClaimLead(client, { leadId, extra: 1 })).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps database errors and thrown failures", async () => {
    const stale = clientWith({ error: { code: "P0001", message: "lead_already_claimed" } });
    expect(await runClaimLead(stale.client, { leadId })).toEqual({ status: "stale" });
    const down = clientWith(new Error("network"));
    expect(await runClaimLead(down.client, { leadId })).toEqual({ status: "error" });
  });
});
