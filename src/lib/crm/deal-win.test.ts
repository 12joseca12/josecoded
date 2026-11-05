import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { cancelRecurring, mapCancelError, mapWinError, winDeal } from "./deal-win";

const dealId = "30000000-0000-4000-8000-0000000000a1";

function rpcClient(error: unknown) {
  const rpc = vi.fn().mockResolvedValue({ error });
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("winDeal", () => {
  it("sends euros computed from the cents the user typed", async () => {
    const { client, rpc } = rpcClient(null);
    const result = await winDeal(client, { dealId, wonAmount: "2.400,50", recurringMonthly: "60" });
    expect(result).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("win_deal", {
      p_deal_id: dealId,
      p_won_amount: 2400.5,
      p_recurring_monthly: 60,
    });
  });

  it("omits the recurring amount when blank", async () => {
    const { client, rpc } = rpcClient(null);
    await winDeal(client, { dealId, wonAmount: "100", recurringMonthly: "  " });
    expect(rpc).toHaveBeenCalledWith("win_deal", {
      p_deal_id: dealId,
      p_won_amount: 100,
      p_recurring_monthly: undefined,
    });
  });

  it.each([
    [{ dealId, wonAmount: "", recurringMonthly: "" }, "wonAmount"],
    [{ dealId, wonAmount: "0", recurringMonthly: "" }, "wonAmount"],
    [{ dealId, wonAmount: "12,345", recurringMonthly: "" }, "wonAmount"],
    [{ dealId, wonAmount: "100", recurringMonthly: "abc" }, "recurringMonthly"],
    [{ dealId, wonAmount: "100", recurringMonthly: "0" }, "recurringMonthly"],
  ])("rejects %j before calling the database", async (raw, field) => {
    const { client, rpc } = rpcClient(null);
    expect(await winDeal(client, raw)).toEqual({ status: "invalid", field });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects extra keys and bad ids", async () => {
    const { client, rpc } = rpcClient(null);
    expect(
      (await winDeal(client, { dealId: "x", wonAmount: "1", recurringMonthly: "" })).status,
    ).toBe("invalid");
    expect(
      (await winDeal(client, { dealId, wonAmount: "1", recurringMonthly: "", extra: 1 })).status,
    ).toBe("invalid");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the typed database errors", () => {
    expect(mapWinError({ code: "42501", message: "forbidden" })).toEqual({ status: "forbidden" });
    expect(mapWinError({ code: "P0001", message: "deal_not_found" })).toEqual({
      status: "not_found",
    });
    expect(mapWinError({ code: "P0001", message: "deal_already_won" })).toEqual({
      status: "already_won",
    });
    expect(mapWinError({ code: "P0001", message: "deal_lost" })).toEqual({ status: "lost" });
    expect(mapWinError({ code: "P0001", message: "invalid_amount" })).toEqual({
      status: "invalid",
      field: "wonAmount",
    });
    expect(mapWinError({ code: "P0001", message: "invalid_recurring" })).toEqual({
      status: "invalid",
      field: "recurringMonthly",
    });
    expect(mapWinError({ code: "XX000", message: "boom" })).toEqual({ status: "error" });
  });

  it("turns a thrown client into an error", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("network"));
    const client = { rpc } as unknown as SupabaseClient<Database>;
    expect(await winDeal(client, { dealId, wonAmount: "10", recurringMonthly: "" })).toEqual({
      status: "error",
    });
  });
});

describe("cancelRecurring", () => {
  it("calls the RPC for the deal", async () => {
    const { client, rpc } = rpcClient(null);
    expect(await cancelRecurring(client, { dealId })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("cancel_recurring", { p_deal_id: dealId });
  });

  it("rejects malformed input", async () => {
    const { client, rpc } = rpcClient(null);
    expect(await cancelRecurring(client, { dealId: "nope" })).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the typed database errors", () => {
    expect(mapCancelError({ code: "42501", message: "forbidden" })).toEqual({
      status: "forbidden",
    });
    expect(mapCancelError({ code: "P0001", message: "no_recurring" })).toEqual({
      status: "not_recurring",
    });
    expect(mapCancelError({ code: "P0001", message: "recurring_already_cancelled" })).toEqual({
      status: "already_cancelled",
    });
    expect(mapCancelError({ code: "XX000", message: null })).toEqual({ status: "error" });
  });
});
