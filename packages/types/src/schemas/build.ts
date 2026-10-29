import { z } from 'zod';

// Data generated at prebuild by apps/web/scripts (task 2.4). The scripts validate before writing and
// the app validates on read, so a missing or malformed field fails the build, not the page.

export const buildInfoSchema = z.object({
  branch: z.string().min(1),
  commit: z.string().min(1),
  nextVersion: z.string().min(1),
  gatewayRoutes: z.number().int().nonnegative(),
  supabase: z.object({
    tables: z.number().int().nonnegative(),
    policies: z.number().int().nonnegative(),
  }),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Real (no `{{DATO}}`) published content per section; the thresholds are spec D33 / D44. */
export const contentIndexSchema = z.object({
  blog: z.object({ guides: z.number().int().nonnegative() }),
  lab: z.object({ demos: z.number().int().nonnegative() }),
  blogEnabled: z.boolean(),
  labEnabled: z.boolean(),
});
