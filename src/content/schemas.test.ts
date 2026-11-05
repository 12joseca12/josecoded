import { describe, expect, it } from "vitest";

import {
  blogSchema,
  cvSchema,
  isPending,
  legalSchema,
  projectSchema,
  stackGroups,
} from "./schemas.ts";

const project = {
  title: "Demo",
  slug: "demo",
  kind: "web",
  status: "live",
  headline: "Resumen",
  description: "Descripción",
  role: "Autor",
  period: "2026",
  sector: "Web",
  stack: ["Next"],
  relatedService: "freelance",
  order: 1,
};

describe("projectSchema", () => {
  it("accepts a valid project and applies defaults", () => {
    const parsed = projectSchema.parse(project);
    expect(parsed.featured).toBe(false);
    expect(parsed.team).toBe(false);
    expect(parsed.links).toEqual({});
    expect(parsed.metric).toBeUndefined();
  });

  it("accepts https links and a sourced metric", () => {
    const parsed = projectSchema.parse({
      ...project,
      links: { web: "https://example.com", store_ios: "https://apps.apple.com/app/id1" },
      metric: { label: "JS", value: "145 KB", source: "pnpm perf:budget", date: "2026-11-05" },
    });
    expect(parsed.links.web).toBe("https://example.com");
    expect(parsed.metric?.source).toBe("pnpm perf:budget");
  });

  it("rejects placeholders and non-https links", () => {
    expect(projectSchema.safeParse({ ...project, links: { web: "{{DATO: url}}" } }).success).toBe(
      false,
    );
    expect(
      projectSchema.safeParse({ ...project, links: { web: "http://example.com" } }).success,
    ).toBe(false);
  });

  it("rejects a metric without source or date", () => {
    expect(
      projectSchema.safeParse({ ...project, metric: { label: "A", value: "1" } }).success,
    ).toBe(false);
  });

  it("rejects a missing field", () => {
    const result = projectSchema.safeParse({ ...project, role: undefined });
    expect(result.error?.issues[0]?.path).toEqual(["role"]);
  });

  it("rejects an unknown field, a bad status and a bad kind", () => {
    expect(projectSchema.safeParse({ ...project, extra: 1 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, status: "done" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, kind: "game" }).success).toBe(false);
  });
});

describe("blogSchema", () => {
  const post = {
    title: "T",
    slug: "t",
    description: "D",
    date: "2026-11-02",
    updated: "2026-11-02",
    category: "precios",
    relatedService: "a-medida",
  };

  it("accepts a post and defaults draft to false", () => {
    expect(blogSchema.parse(post).draft).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(blogSchema.safeParse({ ...post, date: "02/11/2026" }).success).toBe(false);
  });

  it("rejects an unknown category and a missing related service", () => {
    expect(blogSchema.safeParse({ ...post, category: "ia" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...post, relatedService: undefined }).success).toBe(false);
  });

  it("defaults the kind to article and allows two related posts at most", () => {
    expect(blogSchema.parse(post).kind).toBe("article");
    expect(blogSchema.safeParse({ ...post, relatedPosts: ["a", "b", "c"] }).success).toBe(false);
  });
});

describe("legalSchema", () => {
  it("requires title and updated", () => {
    expect(legalSchema.safeParse({ title: "Aviso" }).success).toBe(false);
    expect(legalSchema.safeParse({ title: "Aviso", updated: "2026-11-02" }).success).toBe(true);
  });

  it("defaults draft to false and the summary to empty", () => {
    const parsed = legalSchema.parse({ title: "Aviso", updated: "2026-11-02" });
    expect(parsed.draft).toBe(false);
    expect(parsed.summary).toEqual([]);
  });

  it("accepts at most five summary lines", () => {
    const base = { title: "Aviso", updated: "2026-11-02" };
    expect(legalSchema.safeParse({ ...base, summary: ["a", "b", "c", "d", "e"] }).success).toBe(
      true,
    );
    expect(
      legalSchema.safeParse({ ...base, summary: ["a", "b", "c", "d", "e", "f"] }).success,
    ).toBe(false);
  });
});

describe("isPending", () => {
  it("recognises DATO placeholders only", () => {
    expect(isPending("{{DATO: CV}}")).toBe(true);
    expect(isPending("{{DATO}}")).toBe(true);
    expect(isPending("hola {{DATO}}")).toBe(false);
    expect(isPending(5)).toBe(false);
  });
});

describe("cvSchema", () => {
  const cv = {
    stack: [
      {
        group: "mobile",
        items: [{ name: "React Native", years: 5, level: "advanced" }],
      },
      {
        group: "web",
        items: [{ name: "Next.js", years: "{{DATO: años}}", level: "{{DATO: nivel}}" }],
      },
    ],
    experience: [
      {
        period: "{{DATO: periodo}}",
        role: "{{DATO: cargo}}",
        organization: "{{DATO: empresa}}",
        summary: "{{DATO: resumen}}",
      },
    ],
    education: [],
    file: { es: "{{DATO: CV}}", en: "{{DATO: CV}}" },
  };

  it("accepts resolved values and placeholders side by side", () => {
    expect(cvSchema.safeParse(cv).success).toBe(true);
  });

  it("accepts a CV path once it is known", () => {
    expect(
      cvSchema.safeParse({
        ...cv,
        file: { es: "/cv/jose-carlos.pdf", en: "/cv/jose-carlos-en.pdf" },
      }).success,
    ).toBe(true);
  });

  it("rejects a CV path that does not start with a slash", () => {
    expect(cvSchema.safeParse({ ...cv, file: { es: "cv.pdf", en: "/cv/x.pdf" } }).success).toBe(
      false,
    );
  });

  it("rejects a level outside the scale and negative years", () => {
    const item = (extra: object) => ({
      ...cv,
      stack: [{ group: "mobile", items: [{ name: "X", years: 1, level: "working", ...extra }] }],
    });
    expect(cvSchema.safeParse(item({ level: "guru" })).success).toBe(false);
    expect(cvSchema.safeParse(item({ years: -1 })).success).toBe(false);
  });

  it("rejects an unknown group and a repeated group", () => {
    const items = [{ name: "X", years: 1, level: "working" }];
    expect(cvSchema.safeParse({ ...cv, stack: [{ group: "games", items }] }).success).toBe(false);
    expect(
      cvSchema.safeParse({
        ...cv,
        stack: [
          { group: "mobile", items },
          { group: "mobile", items },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts stack items with only a name", () => {
    const items = [{ name: "Expo" }];
    expect(cvSchema.safeParse({ ...cv, stack: [{ group: "mobile", items }] }).success).toBe(true);
  });

  it("covers the six stack areas", () => {
    expect(stackGroups).toEqual(["mobile", "web", "backend", "ai", "quality", "tools"]);
  });
});
