import { z } from 'zod';

// Project sheets (task 3.1, PANT P7/P8). One JSON per project in this folder; `content/projects/index.ts` lists them
// and `lib/content/projects.ts` reads them. A text Jose still has to supply is a `{{DATO: …}}` string, exactly as in
// `messages`: pages leave such a block out in production. No figure of any kind lives here (no ratings, installs or
// counters): the site publishes none.
// Runs under plain Node too (scripts/content-index.ts), so internal imports carry `.ts`.

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const text = z.string().trim().min(1).max(3000);

const localizedTexts = z.object({
  /** One sentence: what it does, for whom, on which platform. */
  oneLiner: text,
  /** P8 «El reto». */
  challenge: text,
  /** P8 «Qué hice»: three to five points, one per line. */
  work: text,
  /** P8 «Resultado»: verifiable facts only, no metrics. */
  result: text,
});

export const projectSchema = z.object({
  slug,
  name: z.string().trim().min(1).max(60),
  type: z.enum(['app', 'web']),
  /** `private` projects are listed without a case study link. */
  status: z.enum(['published', 'in-use', 'private']),
  /** Tie-break of the ranking and order of the home tour when the proofs do not decide. */
  order: z.number().int().min(0),
  /** Year it was built; a marker while unknown. */
  year: z.union([z.number().int().min(2000).max(2100), z.string().startsWith('{{DATO')]),
  /** Verifiable proofs: each one is a link the visitor can follow. A marker counts as no proof. */
  proofs: z.object({
    appStoreId: z.string().optional(),
    playPackage: z.string().optional(),
    webUrl: z.url().optional(),
    repoUrl: z.url().optional(),
  }),
  /** NDA-reduced sheet: no metrics, never first in the ranking. */
  hideMetrics: z.boolean().default(false),
  hideStack: z.boolean().default(false),
  /** The site itself: the most direct proof, but never the first place of the ranking. */
  self: z.boolean().default(false),
  stack: z.array(z.string().trim().min(1).max(40)).default([]),
  /** `applicationCategory` of the JSON-LD (apps only); a marker leaves it out. */
  applicationCategory: z.string().optional(),
  /** Files under `public/projects/<slug>/`, in gallery order. Empty: the glyph art stands in. */
  screenshots: z.array(z.string().regex(/^\/projects\/[a-z0-9-]+\/[\w.-]+\.(avif|webp|png|jpe?g)$/)).default([]),
  art: z.enum(['phone', 'web']),
  texts: z.object({ es: localizedTexts, en: localizedTexts }),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectTexts = z.infer<typeof localizedTexts>;
