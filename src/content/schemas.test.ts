import { describe, expect, it } from "vitest";

import { blogSchema, legalSchema, projectSchema } from "./schemas.ts";

const project = {
  title: "Demo",
  slug: "demo",
  summary: "Resumen",
  role: "Autor",
  stack: ["Next"],
  year: 2026,
  order: 1,
  status: "live",
};

describe("projectSchema", () => {
  it("accepts a valid project and applies defaults", () => {
    const parsed = projectSchema.parse(project);
    expect(parsed.featured).toBe(false);
    expect(parsed.links).toEqual([]);
  });

  it("accepts placeholders in links and cover", () => {
    const parsed = projectSchema.parse({
      ...project,
      links: [{ label: "Web", href: "{{DATO: url}}" }],
      cover: { src: "{{DATO: portada}}", alt: "Portada" },
    });
    expect(parsed.links).toHaveLength(1);
  });

  it("rejects a missing field", () => {
    const result = projectSchema.safeParse({ ...project, role: undefined });
    expect(result.error?.issues[0]?.path).toEqual(["role"]);
  });

  it("rejects a wrong type", () => {
    const result = projectSchema.safeParse({ ...project, year: "2026" });
    expect(result.error?.issues[0]?.path).toEqual(["year"]);
  });

  it("rejects an unknown field and a bad status", () => {
    expect(projectSchema.safeParse({ ...project, extra: 1 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, status: "done" }).success).toBe(false);
  });
});

describe("blogSchema", () => {
  const post = { title: "T", slug: "t", description: "D", date: "2026-11-02" };

  it("accepts a post and defaults draft to false", () => {
    expect(blogSchema.parse(post).draft).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(blogSchema.safeParse({ ...post, date: "02/11/2026" }).success).toBe(false);
  });
});

describe("legalSchema", () => {
  it("requires title and updated", () => {
    expect(legalSchema.safeParse({ title: "Aviso" }).success).toBe(false);
    expect(legalSchema.safeParse({ title: "Aviso", updated: "2026-11-02" }).success).toBe(true);
  });
});
