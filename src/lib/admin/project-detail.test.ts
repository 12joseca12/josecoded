import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  mapTaskError,
  runArchive,
  runDeleteTask,
  runMoveTask,
  runSetPhase,
  runUpsertTask,
} from "./project-detail";

const projectId = "60000000-0000-4000-8000-000000000001";
const taskId = "61000000-0000-4000-8000-000000000001";
const clientId = "00000000-0000-4000-8000-0000000000d1";

function client(reply: { error?: { code?: string; message?: string } | null } | Error) {
  const rpc = vi.fn(() =>
    reply instanceof Error ? Promise.reject(reply) : Promise.resolve({ error: null, ...reply }),
  );
  return { db: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const form = {
  id: "",
  projectId,
  title: "  Maqueta  ",
  description: " texto ",
  phase: "design",
  status: "doing",
  assigneeId: clientId,
  storyId: "",
};

describe("mapTaskError", () => {
  it("keeps typed errors and hides the rest", () => {
    expect(mapTaskError({ code: "P0001", message: "task_not_deletable" })).toBe(
      "task_not_deletable",
    );
    expect(mapTaskError({ code: "42501" })).toBe("forbidden");
    expect(mapTaskError({ message: "boom" })).toBe("error");
  });
});

describe("runUpsertTask", () => {
  it("creates with trimmed text and nulls for blanks", async () => {
    const { db, rpc } = client({});
    expect(await runUpsertTask(db, form)).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("upsert_task", {
      p_project_id: projectId,
      p_title: "Maqueta",
      p_phase: "design",
      p_id: undefined,
      p_description: "texto",
      p_status: "doing",
      p_assignee_id: clientId,
      p_story_id: undefined,
    });
  });

  it("validates before calling", async () => {
    const { db, rpc } = client({});
    expect(await runUpsertTask(db, { ...form, title: "  " })).toEqual({
      status: "invalid",
      field: "title",
    });
    expect(await runUpsertTask(db, { ...form, phase: "nope" })).toEqual({
      status: "invalid",
      field: "phase",
    });
    expect(await runUpsertTask(db, { ...form, status: "nope" })).toEqual({
      status: "invalid",
      field: "status",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns typed errors and survives throws", async () => {
    expect(
      await runUpsertTask(
        client({ error: { code: "P0001", message: "invalid_assignee" } }).db,
        form,
      ),
    ).toEqual({ status: "error", code: "invalid_assignee" });
    expect(await runUpsertTask(client(new Error("x")).db, form)).toEqual({
      status: "error",
      code: "error",
    });
  });
});

describe("other task and project writes", () => {
  it("moves a task", async () => {
    const { db, rpc } = client({});
    expect(await runMoveTask(db, { id: taskId, phase: "build", sort: 2 })).toEqual({
      status: "done",
    });
    expect(rpc).toHaveBeenCalledWith("move_task", { p_id: taskId, p_phase: "build", p_sort: 2 });
    expect(await runMoveTask(db, { id: taskId, phase: "build", sort: -1 })).toEqual({
      status: "error",
      code: "task_not_found",
    });
  });

  it("deletes a task and maps the refusal", async () => {
    expect(await runDeleteTask(client({}).db, { id: taskId })).toEqual({ status: "done" });
    expect(
      await runDeleteTask(client({ error: { code: "P0001", message: "task_not_deletable" } }).db, {
        id: taskId,
      }),
    ).toEqual({ status: "error", code: "task_not_deletable" });
  });

  it("sets the phase and archives or restores", async () => {
    const { db, rpc } = client({});
    expect(await runSetPhase(db, { id: projectId, phase: "publish" })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenLastCalledWith("set_project_phase", {
      p_id: projectId,
      p_phase: "publish",
    });
    expect(await runArchive(db, { id: projectId, archived: false })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenLastCalledWith("archive_project", {
      p_id: projectId,
      p_archived: false,
    });
    expect(await runSetPhase(db, { id: "x", phase: "publish" })).toEqual({
      status: "error",
      code: "project_not_found",
    });
  });
});
