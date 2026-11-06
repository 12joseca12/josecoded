import { describe, expect, it } from "vitest";

import type { FreelanceProject } from "@/types/freelance";

import { splitProjects } from "./projects";

function project(id: string, overrides: Partial<FreelanceProject>): FreelanceProject {
  return {
    id,
    name: id,
    brief: null,
    phase: "build",
    status: "active",
    started_at: null,
    due_at: null,
    archived_at: null,
    created_at: "2026-10-01T09:00:00+00:00",
    done: 0,
    total: 0,
    percent: 0,
    ...overrides,
  };
}

describe("splitProjects", () => {
  it("keeps active and paused projects open and moves closed or archived ones apart", () => {
    const { open, closed } = splitProjects([
      project("a", {}),
      project("b", { status: "paused" }),
      project("c", { status: "closed" }),
      project("d", { archived_at: "2026-10-20T09:00:00+00:00" }),
    ]);
    expect(open.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(closed.map((entry) => entry.id)).toEqual(["c", "d"]);
  });
});
