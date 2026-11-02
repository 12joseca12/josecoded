// Table of contents of a guide, read from the source at prebuild (scripts/content-index.ts) so the page needs no MDX
// compiler at runtime. The ids must equal the ones `rehype-slug` writes on the compiled `h2` (github-slugger): same
// rule (lowercase, drop everything but letters, marks, numbers, `_`, `-` and space, then spaces to `-`) and the same
// `-1`, `-2` suffix for a repeated title. Runs under plain Node too.

export interface Heading {
  id: string;
  label: string;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replaceAll(' ', '-');
}

/** Plain text of a heading line: inline markup and MDX escapes removed. */
function plain(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*~]+/g, '')
    .replace(/\\(.)/g, '$1')
    .trim();
}

/** The `##` headings of the body (the frontmatter and fenced code are skipped), in order, with unique ids. */
export function extractHeadings(source: string): Heading[] {
  const body = source.replace(/^﻿?---\r?\n[^]*?\r?\n---[ \t]*(?:\r?\n|$)/, '');
  const seen = new Map<string, number>();
  const headings: Heading[] = [];
  let fence: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const marker = line.match(/^\s*(```+|~~~+)/)?.[1];
    if (marker) {
      fence = fence === null ? marker : line.trim().startsWith(fence) ? null : fence;
      continue;
    }
    if (fence !== null) continue;
    const match = line.match(/^## +(.+?)\s*#*\s*$/);
    if (!match?.[1]) continue;
    const label = plain(match[1]);
    const base = slugify(label);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    headings.push({ id: count === 0 ? base : `${base}-${count}`, label });
  }
  return headings;
}
