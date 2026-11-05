import { describe, expect, it } from "vitest";

import { projectSchema } from "@/content/schemas";

import {
  filterProjects,
  filtersAvailable,
  neighbours,
  parseProjectFilter,
  projectContactHref,
  projectsPath,
  serviceHref,
} from "./projects";

const base = {
  title: "Demo",
  slug: "demo",
  kind: "app",
  status: "live",
  headline: "H",
  description: "D",
  role: "R",
  period: "2026",
  sector: "S",
  stack: ["Next"],
  relatedService: "freelance",
  order: 1,
} as const;

const entry = (slug: string, kind: "app" | "web") => ({
  slug,
  meta: projectSchema.parse({ ...base, slug, kind }),
});

describe("filters", () => {
  const list = [entry("a", "app"), entry("b", "app"), entry("c", "web"), entry("d", "web")];

  it("reads the tipo param and falls back to all", () => {
    expect(parseProjectFilter("apps")).toBe("app");
    expect(parseProjectFilter(["webs", "apps"])).toBe("web");
    expect(parseProjectFilter("otra")).toBe("all");
    expect(parseProjectFilter(undefined)).toBe("all");
  });

  it("filters by kind", () => {
    expect(filterProjects(list, "app").map((item) => item.slug)).toEqual(["a", "b"]);
    expect(filterProjects(list, "all")).toHaveLength(4);
  });

  it("offers filters only with two or more per kind", () => {
    expect(filtersAvailable(list)).toBe(true);
    expect(filtersAvailable(list.slice(0, 3))).toBe(false);
  });

  it("builds a path without the param for all", () => {
    expect(projectsPath("all")).toBe("/proyectos");
    expect(projectsPath("web")).toBe("/proyectos?tipo=webs");
  });
});

describe("neighbours", () => {
  const list = [entry("a", "app"), entry("b", "app"), entry("c", "web")];

  it("returns the previous and next entries", () => {
    expect(neighbours(list, "b")).toEqual({ prev: list[0], next: list[2] });
    expect(neighbours(list, "a").prev).toBeNull();
    expect(neighbours(list, "c").next).toBeNull();
    expect(neighbours(list, "zzz")).toEqual({ prev: null, next: null });
  });
});

describe("links", () => {
  it("points to the service and to contact with via and from", () => {
    expect(serviceHref("es", "a-medida")).toBe("/es/servicios/a-medida");
    expect(projectContactHref("es", "freelance", "3cat")).toBe(
      "/es/contacto?via=freelance&from=3cat#formulario",
    );
    expect(projectContactHref("es", "a-medida", "nextraket")).toBe(
      "/es/contacto?via=project&from=nextraket#formulario",
    );
  });
});
