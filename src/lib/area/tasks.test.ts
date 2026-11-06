import { describe, expect, it } from "vitest";

import type { BoardTask } from "@/types/area";

import { groupByPhase } from "./tasks";

function task(id: string, phase: BoardTask["phase"]): BoardTask {
  return {
    id,
    title: id,
    phase,
    status: "todo",
    assigned_to_me: false,
    assignee_kind: "none",
    story: null,
  };
}

describe("groupByPhase", () => {
  it("keeps every phase, in order, even when empty", () => {
    const groups = groupByPhase([task("a", "build"), task("b", "discover"), task("c", "build")]);
    expect(Object.keys(groups)).toEqual(["discover", "design", "build", "publish", "maintain"]);
    expect(groups.build.map((entry) => entry.id)).toEqual(["a", "c"]);
    expect(groups.design).toEqual([]);
  });
});
