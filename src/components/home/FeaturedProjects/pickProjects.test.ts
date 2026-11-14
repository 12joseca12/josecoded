import { describe, expect, it } from "vitest";

import { pickProjects } from "./pickProjects";

const known: Record<string, string> = { a: "A", b: "B" };
const find = (slug: string) => known[slug];

describe("pickProjects", () => {
  it("keeps the configured order", () => {
    expect(pickProjects(["b", "a"], find)).toEqual(["B", "A"]);
  });

  it("ignores slugs without a project", () => {
    expect(pickProjects(["a", "missing", "b"], find)).toEqual(["A", "B"]);
  });

  it("caps the result at three projects", () => {
    const many = (slug: string) => slug;
    expect(pickProjects(["a", "b", "c", "d"], many)).toEqual(["a", "b", "c"]);
  });

  it("returns nothing for an empty list", () => {
    expect(pickProjects([], find)).toEqual([]);
  });
});
