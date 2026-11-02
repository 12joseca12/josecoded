// Writes content/generated/content-index.json at prebuild: how much real content each optional
// section has. Blog needs three guides (spec D33), Lab two demos (D44); a section below its threshold
// vanishes from the whole site (lib/content/sections.ts). Pending texts (`{{DATO` in the frontmatter) do not
// count; a body that merely mentions the marker (a guide about it) is a real text.
// Tasks 4.2 / 4.5 extend this file with the blog index (frontmatter, slugs, translations) and the lab
// schema; the counting rules below are the minimum those tasks build on.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { contentIndexSchema } from '@josecoded/types';

import { frontmatterBlock, parseFrontmatter } from '../content/blog/frontmatter.ts';
import { BLOG_LOCALES, blogIndexSchema } from '../content/blog/schema.ts';
import { rankProjects } from '../content/projects/rank.ts';
import { projectSchema } from '../content/projects/schema.ts';
import { isPendingDato } from '../lib/content/dato.ts';

import type { BlogIndex, BlogPostMeta } from '../content/blog/schema.ts';
import type { ContentIndex } from '@josecoded/types';

export const BLOG_MIN_GUIDES = 3;
export const LAB_MIN_DEMOS = 2;

const LOCALES = ['es', 'en'] as const;

const frontmatter = frontmatterBlock;

/** A text is pending when its frontmatter carries a `{{DATO`; a file without frontmatter is all metadata only for lab metas. */
function isPending(text: string, wholeFileIfNoFrontmatter: boolean): boolean {
  const front = frontmatter(text);
  return isPendingDato(front ?? (wholeFileIfNoFrontmatter ? text : ''));
}

/** Guides per site, not per locale: the same slug in es and en counts once. Notes (`kind: note` in the frontmatter) do not count. */
function countGuides(contentRoot: string): number {
  const slugs = new Set<string>();
  for (const locale of LOCALES) {
    const dir = join(contentRoot, 'blog', locale);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
      const text = readFileSync(join(dir, name), 'utf8');
      if (isPending(text, false) || /^kind:\s*['"]?note\b/m.test(frontmatter(text) ?? '')) continue;
      slugs.add(name.replace(/\.mdx?$/, ''));
    }
  }
  return slugs.size;
}

/** A demo is a folder `lab/<slug>/` with a real `meta.es.md` or `meta.en.md`. */
function countDemos(contentRoot: string): number {
  const dir = join(contentRoot, 'lab');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).filter(
    (entry) =>
      entry.isDirectory() &&
      LOCALES.some((locale) => {
        const meta = join(dir, entry.name, `meta.${locale}.md`);
        return existsSync(meta) && !isPending(readFileSync(meta, 'utf8'), true);
      }),
  ).length;
}

export function computeContentIndex({ contentRoot }: { contentRoot: string }): ContentIndex {
  const guides = countGuides(contentRoot);
  const demos = countDemos(contentRoot);
  return contentIndexSchema.parse({
    blog: { guides },
    lab: { demos },
    blogEnabled: guides >= BLOG_MIN_GUIDES,
    labEnabled: demos >= LAB_MIN_DEMOS,
  });
}

/**
 * Every guide of `content/blog/<locale>/<slug>.md(x)` with its validated frontmatter, newest first. An invalid file
 * fails the build naming the file (the pages never see a malformed guide). The articles are compiled by `@next/mdx`
 * when a page imports them; this index only carries what the listing, the feed and the sitemap need.
 */
export function computeBlogIndex({ contentRoot }: { contentRoot: string }): BlogIndex {
  const found: Omit<BlogPostMeta, 'hasTranslation'>[] = [];
  for (const locale of BLOG_LOCALES) {
    const dir = join(contentRoot, 'blog', locale);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
      const text = readFileSync(join(dir, name), 'utf8');
      try {
        found.push({ ...parseFrontmatter(text), slug: name.replace(/\.mdx?$/, ''), locale, pending: isPending(text, false) });
      } catch (error) {
        throw new Error(`blog/${locale}/${name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
  }
  const slugsByLocale = (locale: string) => new Set(found.filter((post) => post.locale === locale).map((post) => post.slug));
  const has = { es: slugsByLocale('es'), en: slugsByLocale('en') };
  const posts = found
    .map((post) => ({ ...post, hasTranslation: has[post.locale === 'es' ? 'en' : 'es'].has(post.slug) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug) || a.locale.localeCompare(b.locale));
  return blogIndexSchema.parse({ posts });
}

export interface ProjectsIndex {
  /** Slugs in the order of the projects index (proofs, recency, never a reduced sheet or this site first). */
  ranked: string[];
}

/**
 * Validates every sheet in `content/projects/*.json` and ranks them (UX v4.0 §4.5). The index feeds the
 * sitemap, `llms.txt` and the case-study pager; the pages rank at runtime with the same function.
 */
export function computeProjectsIndex({ contentRoot }: { contentRoot: string }): ProjectsIndex {
  const dir = join(contentRoot, 'projects');
  if (!existsSync(dir)) return { ranked: [] };
  const sheets = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => projectSchema.parse(JSON.parse(readFileSync(join(dir, name), 'utf8'))));
  return { ranked: rankProjects(sheets).map((sheet) => sheet.slug) };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const contentRoot = fileURLToPath(new URL('../content', import.meta.url));
  const index = computeContentIndex({ contentRoot });
  mkdirSync(join(contentRoot, 'generated'), { recursive: true });
  writeFileSync(join(contentRoot, 'generated/content-index.json'), `${JSON.stringify(index, null, 2)}\n`);
  const blogIndex = computeBlogIndex({ contentRoot });
  writeFileSync(join(contentRoot, 'generated/blog-index.json'), `${JSON.stringify(blogIndex, null, 2)}\n`);
  const projectsIndex = computeProjectsIndex({ contentRoot });
  writeFileSync(join(contentRoot, 'generated/projects-index.json'), `${JSON.stringify(projectsIndex, null, 2)}\n`);
  console.log(`content-index: ${index.blog.guides} guides (blog ${index.blogEnabled}), ${index.lab.demos} demos (lab ${index.labEnabled}), ${projectsIndex.ranked.length} projects, ${blogIndex.posts.length} blog entries`);
  for (const post of blogIndex.posts.filter((entry) => entry.pending)) console.log(`content-index: {{DATO}} pending in blog/${post.locale}/${post.slug}`);
}
