import { buildInfoSchema } from '@josecoded/types';

import raw from '@/content/generated/build-info.json';

import type { BuildInfo } from '@josecoded/types';

// Written at prebuild by scripts/build-info.ts (task 2.4). A missing or malformed field fails the
// build, not the page.
export function getBuildInfo(): BuildInfo {
  return buildInfoSchema.parse(raw);
}
