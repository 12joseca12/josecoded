import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchProjectStories, mapDecisionError, runDecideStory } from "./project-stories";

const storyId = "62000000-0000-4000-8000-000000000001";
const projectId = "60000000-0000-4000-8000-000000000001";

function rpcClient(reply: { data?: unknown; error?: { code?: string; message?: string } | null }) {
  const rpc = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  return { db: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const accept = {
  id: storyId,
  decision: "accept",
  hours: "",
  amount: "",
  note: " ",
  createTask: true,
};

describe("mapDecisionError", () => {
  it("keeps typed errors and hides the rest", () => {
    expect(mapDecisionError({ code: "P0001", message: "story_not_proposed" })).toBe(
      "story_not_proposed",
    );
    expect(mapDecisionError({ code: "42501" })).toBe("forbidden");
    expect(mapDecisionError({ message: "boom" })).toBe("error");
  });
});

describe("runDecideStory", () => {
  it("accepts with a task and reports the next status", async () => {
    const { db, rpc } = rpcClient({ data: "in_tasks" });
    expect(await runDecideStory(db, accept)).toEqual({ status: "done", next: "in_tasks" });
    expect(rpc).toHaveBeenCalledWith("decide_story", {
      p_id: storyId,
      p_decision: "accept",
      p_hours: undefined,
      p_amount: undefined,
      p_note: undefined,
      p_create_task: true,
    });
  });

  it("only asks for a task when accepting", async () => {
    const { db, rpc } = rpcClient({ data: "in_review" });
    await runDecideStory(db, {
      ...accept,
      decision: "out_of_scope",
      hours: "12,5",
      amount: "480",
      note: "Extra",
    });
    expect(rpc).toHaveBeenCalledWith("decide_story", {
      p_id: storyId,
      p_decision: "out_of_scope",
      p_hours: 12.5,
      p_amount: 480,
      p_note: "Extra",
      p_create_task: false,
    });
  });

  it("validates the conditional requirements before calling", async () => {
    const { db, rpc } = rpcClient({ data: "rejected" });
    expect(await runDecideStory(db, { ...accept, decision: "reject", note: "  " })).toEqual({
      status: "invalid",
      field: "note",
    });
    expect(await runDecideStory(db, { ...accept, decision: "out_of_scope" })).toEqual({
      status: "invalid",
      field: "hours",
    });
    expect(
      await runDecideStory(db, { ...accept, decision: "out_of_scope", hours: "3", amount: "x" }),
    ).toEqual({ status: "invalid", field: "amount" });
    expect(await runDecideStory(db, { ...accept, decision: "maybe" })).toEqual({
      status: "invalid",
      field: "decision",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns typed errors and rejects an unknown next status", async () => {
    expect(
      await runDecideStory(
        rpcClient({ error: { code: "P0001", message: "story_not_proposed" } }).db,
        accept,
      ),
    ).toEqual({ status: "error", code: "story_not_proposed" });
    expect(await runDecideStory(rpcClient({ data: "weird" }).db, accept)).toEqual({
      status: "error",
      code: "error",
    });
  });
});

describe("fetchProjectStories", () => {
  function reading(reply: { data?: unknown; error?: { message: string } | null }) {
    const order = vi.fn(() => Promise.resolve({ error: null, ...reply }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    return { db: { from: () => ({ select }) } as unknown as SupabaseClient<Database>, eq };
  }

  const row = {
    id: storyId,
    project_id: projectId,
    author_id: null,
    title: "Buscador",
    as_a: "a",
    i_want: "b",
    so_that: "c",
    criteria: ["x"],
    status: "proposed",
    out_of_scope: false,
    estimate_hours: null,
    estimate_amount: null,
    decision_note: null,
    decided_at: null,
    confirmed_at: null,
    task_id: null,
    created_at: "2026-10-15T09:00:00+00:00",
  };

  it("reads and validates the rows of a project", async () => {
    const { db, eq } = reading({ data: [row] });
    expect(await fetchProjectStories(db, projectId)).toMatchObject({
      status: "ok",
      stories: [{ title: "Buscador" }],
    });
    expect(eq).toHaveBeenCalledWith("project_id", projectId);
  });

  it("fails closed on errors and malformed rows", async () => {
    expect(await fetchProjectStories(reading({ error: { message: "x" } }).db, projectId)).toEqual({
      status: "error",
    });
    expect(await fetchProjectStories(reading({ data: [{ id: "x" }] }).db, projectId)).toEqual({
      status: "error",
    });
  });
});
