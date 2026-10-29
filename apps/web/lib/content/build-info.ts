import { z } from 'zod';

import raw from '@/content/generated/build-info.json';

// Written at prebuild by scripts/build-info.ts (task 2.4); until then the committed file is a
// sample with the same shape. A missing or malformed field fails the build, not the page.
const buildInfoSchema = z.object({
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

export type BuildInfo = z.infer<typeof buildInfoSchema>;

export function getBuildInfo(): BuildInfo {
  return buildInfoSchema.parse(raw);
}
