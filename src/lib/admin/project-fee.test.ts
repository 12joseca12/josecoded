import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  mapFeeError,
  runAddItem,
  runApproveItems,
  runDeleteItem,
  runRejectItem,
  runSetFee,
} from "./project-fee";

const projectId = "60000000-0000-4000-8000-000000000001";
const feeId = "74000000-0000-4000-8000-000000000001";
const itemId = "75000000-0000-4000-8000-000000000001";

interface Reply {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

function client(replies: Reply[], count = 0) {
  const rpc = vi.fn(() => Promise.resolve({ error: null, ...(replies.shift() ?? {}) }));
  const limit = vi.fn(() => Promise.resolve({ error: null, data: count > 0 ? [{ id: "x" }] : [] }));
  const eq = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { db: { rpc, from } as unknown as SupabaseClient<Database>, rpc };
}

const hourly = {
  projectId,
  mode: "hourly",
  amount: "",
  hourlyRate: "35",
  hoursCap: "60",
  note: " ",
  firstItemLabel: "Total",
};

describe("mapFeeError", () => {
  it("keeps typed errors and hides the rest", () => {
    expect(mapFeeError({ code: "P0001", message: "fee_has_items" })).toBe("fee_has_items");
    expect(mapFeeError({ code: "42501" })).toBe("forbidden");
    expect(mapFeeError({ message: "boom" })).toBe("error");
  });
});

describe("runSetFee", () => {
  it("sends an hourly fee in euros", async () => {
    const { db, rpc } = client([{ data: feeId }]);
    expect(await runSetFee(db, hourly)).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_freelance_fee", {
      p_project_id: projectId,
      p_mode: "hourly",
      p_amount: undefined,
      p_hourly_rate: 35,
      p_hours_cap: 60,
      p_note: undefined,
    });
  });

  it("preloads one entry for a new fixed fee", async () => {
    const { db, rpc } = client([{ data: feeId }, {}], 0);
    const result = await runSetFee(db, {
      ...hourly,
      mode: "fixed",
      amount: "1.200,50",
      hourlyRate: "",
      hoursCap: "",
    });
    expect(result).toEqual({ status: "done" });
    expect(rpc).toHaveBeenLastCalledWith("add_fee_item", {
      p_fee_id: feeId,
      p_label: "Total",
      p_amount: 1200.5,
    });
  });

  it("does not preload when the fixed fee already has entries", async () => {
    const { db, rpc } = client([{ data: feeId }], 2);
    await runSetFee(db, { ...hourly, mode: "fixed", amount: "900", hourlyRate: "", hoursCap: "" });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("validates the mode requirements before calling", async () => {
    const { db, rpc } = client([]);
    expect(await runSetFee(db, { ...hourly, hourlyRate: "" })).toEqual({
      status: "invalid",
      field: "hourlyRate",
    });
    expect(await runSetFee(db, { ...hourly, mode: "fixed", hourlyRate: "" })).toEqual({
      status: "invalid",
      field: "amount",
    });
    expect(await runSetFee(db, { ...hourly, hoursCap: "1,25" })).toEqual({
      status: "invalid",
      field: "hoursCap",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the database errors", async () => {
    const { db } = client([{ error: { code: "P0001", message: "fee_has_items" } }]);
    expect(await runSetFee(db, hourly)).toEqual({ status: "error", code: "fee_has_items" });
  });
});

describe("items", () => {
  it("adds a milestone", async () => {
    const { db, rpc } = client([{}]);
    expect(await runAddItem(db, { feeId, label: " Diseño ", amount: "300", workedOn: "" })).toEqual(
      { status: "done" },
    );
    expect(rpc).toHaveBeenCalledWith("add_fee_item", {
      p_fee_id: feeId,
      p_label: "Diseño",
      p_amount: 300,
      p_worked_on: undefined,
    });
  });

  it("rejects an invalid amount before calling", async () => {
    const { db, rpc } = client([]);
    expect(await runAddItem(db, { feeId, label: "x", amount: "abc", workedOn: "" })).toEqual({
      status: "invalid",
      field: "amount",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("approves a selection and reports the count", async () => {
    const { db } = client([{ data: 1 }]);
    expect(await runApproveItems(db, { ids: [itemId] })).toEqual({ status: "done", count: 1 });
    expect(await runApproveItems(db, { ids: [] })).toEqual({ status: "invalid", field: "ids" });
  });

  it("requires a reason to reject", async () => {
    const { db, rpc } = client([{}]);
    expect(await runRejectItem(db, { id: itemId, reason: "  " })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(await runRejectItem(db, { id: itemId, reason: "Duplicado" })).toEqual({
      status: "done",
    });
    expect(rpc).toHaveBeenCalledWith("reject_fee_item", { p_id: itemId, p_reason: "Duplicado" });
  });

  it("deletes a pending entry and maps errors", async () => {
    const { db } = client([{ error: { code: "P0001", message: "item_not_pending" } }]);
    expect(await runDeleteItem(db, { id: itemId })).toEqual({
      status: "error",
      code: "item_not_pending",
    });
  });
});
