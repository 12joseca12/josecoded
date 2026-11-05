import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ContentError,
  countWords,
  extractHeadings,
  findPlaceholders,
  headingId,
  readContent,
  readCv,
  renderIndex,
} from "./loader.ts";

let base = "";

function write(path: string, source: string) {
  const full = join(base, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, source);
}

const project = (overrides: Record<string, string> = {}) => {
  const fields = {
    title: "Demo",
    slug: "demo",
    summary: "Resumen",
    role: "Autor",
    stack: "[Next]",
    year: "2026",
    order: "1",
    status: "live",
    ...overrides,
  };
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join("\n")}\n---\n\n# Demo\n`;
};

function failure(): string {
  try {
    readContent(base);
  } catch (error) {
    if (error instanceof ContentError) return error.message;
    throw error;
  }
  throw new Error("expected readContent to throw");
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "content-"));
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe("readContent", () => {
  it("returns validated entries per type", () => {
    write("content/projects/demo.mdx", project());
    write("content/legal/aviso.mdx", '---\ntitle: Aviso\nupdated: "2026-11-02"\n---\n\nTexto\n');
    const entries = readContent(base);
    expect(entries.map((entry) => `${entry.type}:${entry.slug}`)).toEqual([
      "projects:demo",
      "legal:aviso",
    ]);
  });

  it("names the file and the field when a field is missing", () => {
    write("content/projects/demo.mdx", project({ role: "" }).replace("role: \n", ""));
    expect(failure()).toContain('content/projects/demo.mdx: field "role"');
  });

  it("names the file and the field when a type is wrong", () => {
    write("content/projects/demo.mdx", project({ year: '"2026"' }));
    expect(failure()).toContain('content/projects/demo.mdx: field "year"');
  });

  it("rejects a slug that differs from the file name", () => {
    write("content/projects/demo.mdx", project({ slug: "other" }));
    expect(failure()).toContain('field "slug": must equal the file name "demo"');
  });

  it("rejects duplicated order values", () => {
    write("content/projects/demo.mdx", project());
    write("content/projects/second.mdx", project({ slug: "second" }));
    expect(failure()).toContain('content/projects/second.mdx: field "order"');
  });

  it("rejects a file without frontmatter and invalid YAML", () => {
    write("content/blog/plain.mdx", "# Sin frontmatter\n");
    write("content/blog/broken.mdx", "---\ntitle: [unclosed\n---\n\nTexto\n");
    const message = failure();
    expect(message).toContain("content/blog/plain.mdx: missing frontmatter");
    expect(message).toContain("content/blog/broken.mdx: frontmatter is not valid YAML");
  });
});

describe("findPlaceholders", () => {
  it("lists every DATO placeholder with file and line", () => {
    write("content/projects/demo.mdx", project({ summary: '"{{DATO: resumen}}"' }));
    const found = findPlaceholders(base, readContent(base));
    expect(found).toEqual([
      { file: "content/projects/demo.mdx", line: 4, text: 'summary: "{{DATO: resumen}}"' },
    ]);
  });
});

describe("renderIndex", () => {
  it("emits a typed lazy import per entry", () => {
    write("content/projects/demo.mdx", project());
    const source = renderIndex(readContent(base));
    expect(source).toContain('import("../../content/projects/demo.mdx")');
    expect(source).toContain("export const projects: ContentEntry<ProjectMeta>[]");
    expect(source).toContain("export const blog: ContentEntry<BlogMeta>[] = []");
  });
});

describe("extractHeadings", () => {
  it("lists level-two headings with the slug rehype-slug will give them", () => {
    const source =
      "---\ntitle: T\n---\n\n# Uno\n\n## Qué hice\n\ntexto\n\n### Detalle\n\n## **Otro** `tema`\n";
    expect(extractHeadings(source)).toEqual([
      { id: "qué-hice", label: "Qué hice" },
      { id: "otro-tema", label: "Otro tema" },
    ]);
  });

  it("ignores headings inside code fences", () => {
    expect(extractHeadings("```md\n## Falso\n```\n\n## Real\n")).toEqual([
      { id: "real", label: "Real" },
    ]);
  });

  it("drops punctuation and keeps accents and hyphens", () => {
    expect(headingId("¿Cómo trabajo? Sí-o-sí")).toBe("cómo-trabajo-sí-o-sí");
  });
});

describe("readCv", () => {
  const cv = {
    stack: [{ group: "web", items: [{ name: "Next.js", years: 3, level: "advanced" }] }],
    experience: [],
    education: [],
    file: { es: "{{DATO: CV}}", en: "{{DATO: CV}}" },
  };

  it("returns the validated CV", () => {
    write("content/cv.json", JSON.stringify(cv));
    expect(readCv(base).stack).toHaveLength(1);
  });

  it("names the file and the field when the CV is invalid", () => {
    write("content/cv.json", JSON.stringify({ ...cv, file: { en: "/x.pdf" } }));
    expect(() => readCv(base)).toThrow('content/cv.json: field "file.es"');
  });

  it("reports malformed JSON", () => {
    write("content/cv.json", "{");
    expect(() => readCv(base)).toThrow("content/cv.json: not valid JSON");
  });
});

describe("countWords", () => {
  it("counts prose words and ignores frontmatter, tags and bare symbols", () => {
    const source =
      "---\ntitle: T\n---\n\nUna **frase** de cinco.\n\n<RelatedService />\n\n| --- |\n";
    expect(countWords(source)).toBe(4);
  });
});
