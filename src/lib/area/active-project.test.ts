import { describe, expect, it } from "vitest";

import type { AreaProject } from "@/types/area";

import { readParam, resolveActiveProject } from "./active-project";

function project(id: string, status: AreaProject["status"] = "active"): AreaProject {
  return {
    id,
    name: id,
    phase: "build",
    status,
    offer_slug: null,
    due_at: null,
    created_at: "2026-11-01T00:00:00Z",
  };
}

const a = project("a");
const b = project("b");
const paused = project("p", "paused");

describe("resolveActiveProject", () => {
  it("returns null without projects", () => {
    expect(resolveActiveProject([], "a", "b")).toBeNull();
  });

  it("prefers the requested project over the remembered one", () => {
    expect(resolveActiveProject([a, b], "b", "a")).toBe(b);
  });

  it("falls back to the remembered project when the request is unknown", () => {
    expect(resolveActiveProject([a, b], "zzz", "b")).toBe(b);
  });

  it("ignores ids that are not the caller's projects", () => {
    expect(resolveActiveProject([a], "other", "other")).toBe(a);
  });

  it("picks the most recent active project by default", () => {
    expect(resolveActiveProject([paused, a, b], null, null)).toBe(a);
  });

  it("uses the first project when none is active", () => {
    expect(resolveActiveProject([paused], null, null)).toBe(paused);
  });
});

describe("readParam", () => {
  it("reads the first value and treats blanks as absent", () => {
    expect(readParam("x")).toBe("x");
    expect(readParam(["x", "y"])).toBe("x");
    expect(readParam("")).toBeNull();
    expect(readParam(undefined)).toBeNull();
  });
});
