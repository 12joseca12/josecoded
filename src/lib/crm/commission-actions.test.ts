import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { approveLines, mapApproveError, mapRejectError, rejectLine } from "./commission-actions";

const id = "61000000-0000-4000-8000-000000000001";

function rpcClient(result: { data?: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("approveLines", () => {
  it("approves a selection and returns how many changed", async () => {
    const { client, rpc } = rpcClient({ data: 2, error: null });
    expect(
      await approveLines(client, { ids: [id, "61000000-0000-4000-8000-000000000002"] }),
    ).toEqual({
      status: "done",
      count: 2,
    });
    expect(rpc).toHaveBeenCalledWith("approve_commission_lines", {
      p_ids: [id, "61000000-0000-4000-8000-000000000002"],
    });
  });

  it.each([{ ids: [] }, { ids: ["nope"] }, { ids: [id], extra: 1 }, null])(
    "refuses %j without calling the database",
    async (raw) => {
      const { client, rpc } = rpcClient({ error: null });
      expect(await approveLines(client, raw)).toEqual({
        status: "failed",
        code: "invalid_selection",
      });
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it("maps the typed database errors", async () => {
    expect(mapApproveError({ code: "P0001", message: "line_not_accrued" })).toBe(
      "line_not_accrued",
    );
    expect(mapApproveError({ code: "42501", message: "forbidden" })).toBe("forbidden");
    expect(mapApproveError({ code: "XX000", message: "boom" })).toBe("error");
    const stale = rpcClient({ error: { code: "P0001", message: "line_not_accrued" } });
    expect(await approveLines(stale.client, { ids: [id] })).toEqual({
      status: "failed",
      code: "line_not_accrued",
    });
  });
});

describe("rejectLine", () => {
  it("sends the trimmed reason", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await rejectLine(client, { id, reason: "  Cobro devuelto  " })).toEqual({
      status: "done",
    });
    expect(rpc).toHaveBeenCalledWith("reject_commission_line", {
      p_id: id,
      p_reason: "Cobro devuelto",
    });
  });

  it("needs a reason before touching the database", async () => {
    const { client, rpc } = rpcClient({ error: null });
    expect(await rejectLine(client, { id, reason: "   " })).toEqual({
      status: "failed",
      code: "reason_required",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps the typed database errors", () => {
    expect(mapRejectError({ code: "P0001", message: "line_not_found" })).toBe("line_not_found");
    expect(mapRejectError({ code: "P0001", message: "reason_required" })).toBe("reason_required");
    expect(mapRejectError({ code: "42501", message: "x" })).toBe("forbidden");
    expect(mapRejectError({ code: "XX000", message: null })).toBe("error");
  });
});
