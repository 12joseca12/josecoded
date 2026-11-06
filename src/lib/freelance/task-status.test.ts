import { describe, expect, it, vi } from "vitest";

import type { ServerSupabase } from "@/lib/supabase/server";

import { setMyTaskStatus } from "./task-status";

const id = "61000000-0000-4000-8000-000000000001";

function clientWith(error: { code?: string; message?: string } | null) {
  const rpc = vi.fn(() => Promise.resolve({ error }));
  return { client: { rpc } as unknown as ServerSupabase, rpc };
}

describe("setMyTaskStatus", () => {
  it("calls the RPC with the task and the new status", async () => {
    const { client, rpc } = clientWith(null);
    expect(await setMyTaskStatus(client, id, "doing")).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_my_task_status", { p_id: id, p_status: "doing" });
  });

  it("rejects a malformed id or status before calling", async () => {
    const { client, rpc } = clientWith(null);
    expect(await setMyTaskStatus(client, "nope", "doing")).toEqual({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps a privilege error to forbidden and a missing task to stale", async () => {
    expect(await setMyTaskStatus(clientWith({ code: "42501" }).client, id, "done")).toEqual({
      status: "forbidden",
    });
    expect(
      await setMyTaskStatus(
        clientWith({ code: "P0001", message: "task_not_found" }).client,
        id,
        "done",
      ),
    ).toEqual({ status: "stale" });
    expect(await setMyTaskStatus(clientWith({ message: "boom" }).client, id, "done")).toEqual({
      status: "error",
    });
  });
});
