import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchTeamPeople, mapTeamError, runSetClient, runSetFreelance } from "./project-team";

const projectId = "60000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-0000000000d1";

function rpcClient(reply: { error?: { code?: string; message?: string } | null }) {
  const rpc = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  return { db: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("mapTeamError", () => {
  it("keeps typed errors", () => {
    expect(mapTeamError({ code: "P0001", message: "invalid_client" })).toBe("invalid_client");
    expect(mapTeamError({ code: "42501" })).toBe("forbidden");
    expect(mapTeamError({ message: "boom" })).toBe("error");
  });
});

describe("runSetClient and runSetFreelance", () => {
  it("assigns a client", async () => {
    const { db, rpc } = rpcClient({});
    expect(await runSetClient(db, { projectId, userId })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("set_project_client", { p_id: projectId, p_user_id: userId });
    expect(await runSetClient(db, { projectId, userId: "x" })).toEqual({ status: "invalid" });
  });

  it("clears or sets the freelance", async () => {
    const { db, rpc } = rpcClient({});
    await runSetFreelance(db, { projectId, userId: "" });
    expect(rpc).toHaveBeenLastCalledWith("set_project_freelance", {
      p_id: projectId,
      p_user_id: undefined,
    });
    await runSetFreelance(db, { projectId, userId });
    expect(rpc).toHaveBeenLastCalledWith("set_project_freelance", {
      p_id: projectId,
      p_user_id: userId,
    });
    expect(
      await runSetFreelance(
        rpcClient({ error: { code: "P0001", message: "invalid_freelance" } }).db,
        {
          projectId,
          userId,
        },
      ),
    ).toEqual({ status: "error", code: "invalid_freelance" });
  });
});

describe("fetchTeamPeople", () => {
  function people(reply: { data?: unknown; error?: { message: string } | null }) {
    const order = vi.fn(() => Promise.resolve({ error: null, ...reply }));
    const inOp = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ in: inOp }));
    return { db: { from: () => ({ select }) } as unknown as SupabaseClient<Database> };
  }

  it("splits clients and freelances", async () => {
    const data = [
      { id: userId, full_name: "Carla", role: "client" },
      { id: projectId, full_name: "Fran", role: "freelance" },
    ];
    expect(await fetchTeamPeople(people({ data }).db)).toEqual({
      status: "ok",
      clients: [{ id: userId, name: "Carla" }],
      freelances: [{ id: projectId, name: "Fran" }],
    });
  });

  it("fails closed", async () => {
    expect(await fetchTeamPeople(people({ error: { message: "x" } }).db)).toEqual({
      status: "error",
    });
    expect(await fetchTeamPeople(people({ data: [{ id: "x" }] }).db)).toEqual({ status: "error" });
  });
});
