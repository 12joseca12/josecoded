import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { MediaManifest } from '@josecoded/types';

/** Byte limits per generated file (DT 1.6.3, spec 12.3; the 700 KB video cap was set by Jose on 2026-09-30). Decimal KB. */
export const LIMITS: Readonly<Record<string, number>> = {
  'hero/video.webm': 700_000,
  'hero/video.mp4': 700_000,
  'hero/poster.avif': 60_000,
  'hero/poster.webp': 60_000,
  // phones at <= 2 dppx get this one (the LCP image there): 560 px is what a 1.75 dppx 360-412 px stage needs
  'hero/poster-sm.avif': 32_000,
  'art/glyph-phone.avif': 60_000,
  'art/glyph-web.avif': 60_000,
};

export type { MediaManifest } from '@josecoded/types';

export type MediaCheck = { ok: boolean; errors: string[] };

/** Pure part of `hero:media:check`: the manifest must carry the current hash and every file must be within its limit. */
export function checkMedia(manifest: MediaManifest, expectedHash: string): MediaCheck {
  const errors: string[] = [];
  if (manifest.paramsHash !== expectedHash) {
    errors.push(`paramsHash ${manifest.paramsHash} does not match ${expectedHash}: run "pnpm hero:media" to regenerate`);
  }
  for (const [name, limit] of Object.entries(LIMITS)) {
    const bytes = manifest.files[name]?.bytes;
    if (bytes === undefined) errors.push(`${name} is missing from the manifest`);
    else if (bytes > limit) errors.push(`${name} is ${bytes} bytes, over the ${limit / 1000} KB limit`);
  }
  return { ok: errors.length === 0, errors };
}

/** Disk part: every file of the manifest exists in `publicDir` with exactly the recorded bytes and sha256. */
export function checkMediaFiles(manifest: MediaManifest, publicDir: string): MediaCheck {
  const errors: string[] = [];
  for (const [name, { bytes, sha256 }] of Object.entries(manifest.files)) {
    const path = join(publicDir, name);
    if (!existsSync(path)) {
      errors.push(`${name} does not exist in ${publicDir}`);
      continue;
    }
    const size = statSync(path).size;
    if (size !== bytes) errors.push(`${name} has ${size} bytes, the manifest says ${bytes}`);
    else if (createHash('sha256').update(readFileSync(path)).digest('hex') !== sha256) errors.push(`${name} has the recorded size but a different sha256: it was altered after generation`);
  }
  return { ok: errors.length === 0, errors };
}
