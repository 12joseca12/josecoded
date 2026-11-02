import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ContentError, findPlaceholders, readContent, renderIndex } from "./loader.ts";

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
