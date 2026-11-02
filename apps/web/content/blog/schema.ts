import { z } from 'zod';

// Frontmatter of a guide (task 4.2, PANT P9/P10): the YAML block at the top of `content/blog/<locale>/<slug>.mdx`.
// One schema for the files (scripts/content-index.ts validates every one at prebuild, so a bad file fails the build)
// and for the generated `blog-index.json` the pages read. A text Jose still has to supply is a `{{DATO: …}}` string:
// (quoted in the YAML: unquoted, `{{` opens a flow mapping and the file is rejected) such a guide is listed outside production and does not count for the three-guides rule (spec D33).
// Runs under plain Node too, so internal imports carry `.ts`.

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const BLOG_LOCALES = ['es', 'en'] as const;

export const frontmatterSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  /** The answer in one sentence plus «con código» (SEO/GEO §2.6, ≤ 155 characters once real). */
  description: z.string().trim().min(1).max(300),
  /** Publication day; a marker is not allowed here (it feeds `datePublished`). */
  date: day,
  updated: day.optional(),
  /** Only `guide` counts for the three-guides rule. */
  kind: z.enum(['guide', 'note']).default('guide'),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
  readingMinutes: z.number().int().min(1).max(120),
  /** Who the guide is for (TechArticle `proficiencyLevel`); left out when not stated. */
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  /** The lab demo this guide explains, for «Probar la demo →». */
  labSlug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** One entry of `content/generated/blog-index.json`: the frontmatter plus where the file lives. */
export const blogPostMetaSchema = frontmatterSchema.extend({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  locale: z.enum(BLOG_LOCALES),
  /** A `{{DATO` marker in the frontmatter. */
  pending: z.boolean(),
  /** The same slug exists in the other language. */
  hasTranslation: z.boolean(),
  /** The `h2` of the body for the page's table of contents (content/blog/headings.ts). */
  headings: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).default([]),
});

export type BlogPostMeta = z.infer<typeof blogPostMetaSchema>;

export const blogIndexSchema = z.object({ posts: z.array(blogPostMetaSchema) });
export type BlogIndex = z.infer<typeof blogIndexSchema>;
