import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";
import type { z } from "zod";

import { contentSchemas, type ContentType, contentTypes, type Cv, cvSchema } from "./schemas.ts";

export interface Heading {
  id: string;
  label: string;
}

export interface LoadedEntry {
  type: ContentType;
  file: string;
  slug: string;
  meta: Record<string, unknown>;
  headings: Heading[];
  words: number;
}

export interface Placeholder {
  file: string;
  line: number;
  text: string;
}

export class ContentError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(problems.map((problem) => `content: ${problem}`).join("\n"));
    this.name = "ContentError";
    this.problems = problems;
  }
}

const fence = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const placeholderPattern = /\\?\{\\?\{DATO.*?\\?\}\\?\}/;

function describePath(path: PropertyKey[]): string {
  return path.length === 0 ? "frontmatter" : `field "${path.map(String).join(".")}"`;
}

function describeIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => `${file}: ${describePath(issue.path)}: ${issue.message}`);
}

function parseFrontmatter(file: string, source: string): { data?: unknown; problems: string[] } {
  const match = fence.exec(source);
  if (!match) return { problems: [`${file}: missing frontmatter block delimited by ---`] };
  try {
    return { data: parse(match[1] ?? "") as unknown, problems: [] };
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : "invalid YAML";
    return { problems: [`${file}: frontmatter is not valid YAML: ${reason}`] };
  }
}

const headingLine = /^##\s+(.+?)\s*#*\s*$/;
const codeFence = /^\s*(```|~~~)/;

function plainHeading(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\\(.)/g, "$1")
    .trim();
}

export function headingId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replaceAll(" ", "-");
}

export function extractHeadings(source: string): Heading[] {
  const body = source.replace(fence, "");
  const headings: Heading[] = [];
  let inCode = false;
  for (const line of body.split("\n")) {
    if (codeFence.test(line)) {
      inCode = !inCode;
      continue;
    }
    const match = inCode ? null : headingLine.exec(line);
    if (match?.[1]) {
      const label = plainHeading(match[1]);
      headings.push({ id: headingId(label), label });
    }
  }
  return headings;
}

export function countWords(source: string): number {
  return source
    .replace(fence, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function listFiles(base: string, type: ContentType): string[] {
  const dir = join(base, "content", type);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();
}

export function readContent(base: string): LoadedEntry[] {
  const entries: LoadedEntry[] = [];
  const problems: string[] = [];

  for (const type of contentTypes) {
    const seenOrders = new Map<number, string>();
    for (const name of listFiles(base, type)) {
      const file = `content/${type}/${name}`;
      const source = readFileSync(join(base, file), "utf8");
      const { data, problems: frontmatterProblems } = parseFrontmatter(file, source);
      problems.push(...frontmatterProblems);
      if (frontmatterProblems.length > 0) continue;

      const result = contentSchemas[type].safeParse(data);
      if (!result.success) {
        problems.push(...describeIssues(file, result.error));
        continue;
      }

      const meta = result.data as Record<string, unknown>;
      const fileSlug = name.replace(/\.mdx$/, "");
      const slug = typeof meta.slug === "string" ? meta.slug : fileSlug;
      if (slug !== fileSlug) {
        problems.push(`${file}: field "slug": must equal the file name "${fileSlug}"`);
        continue;
      }
      if (typeof meta.order === "number") {
        const other = seenOrders.get(meta.order);
        if (other) {
          problems.push(
            `${file}: field "order": ${String(meta.order)} is already used by ${other}`,
          );
          continue;
        }
        seenOrders.set(meta.order, file);
      }
      entries.push({
        type,
        file,
        slug: fileSlug,
        meta,
        headings: extractHeadings(source),
        words: countWords(source),
      });
    }
  }

  if (problems.length > 0) throw new ContentError(problems);
  return entries;
}

export function readCv(base: string): Cv {
  const file = "content/cv.json";
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(join(base, file), "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : "invalid JSON";
    throw new ContentError([`${file}: not valid JSON: ${reason}`]);
  }
  const result = cvSchema.safeParse(data);
  if (!result.success) throw new ContentError(describeIssues(file, result.error));
  return result.data;
}

export function findPlaceholders(
  base: string,
  entries: readonly { file: string }[],
): Placeholder[] {
  return entries.flatMap((entry) =>
    readFileSync(join(base, entry.file), "utf8")
      .split("\n")
      .flatMap((text, index) =>
        placeholderPattern.test(text)
          ? [{ file: entry.file, line: index + 1, text: text.trim() }]
          : [],
      ),
  );
}

const metaTypes = { projects: "ProjectMeta", blog: "BlogMeta", legal: "LegalMeta" } as const;

export function renderIndex(entries: LoadedEntry[]): string {
  const sections = contentTypes.map((type) => {
    const items = entries
      .filter((entry) => entry.type === type)
      .map(
        (entry) =>
          `{ slug: "${entry.slug}", meta: ${JSON.stringify(entry.meta)}, headings: ${JSON.stringify(entry.headings)}, words: ${entry.words}, load: () => import("../../${entry.file}") }`,
      );
    return `export const ${type}: ContentEntry<${metaTypes[type]}>[] = [${items.join(",")}];`;
  });
  return [
    `import type { BlogMeta, LegalMeta, ProjectMeta } from "./schemas";`,
    `import type { ContentEntry } from "./types";`,
    ...sections,
    "",
  ].join("\n");
}
