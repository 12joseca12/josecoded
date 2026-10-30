import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Byte limits per generated file (DT 1.6.3, spec 12.3; the 700 KB video cap was set by Jose on 2026-09-30). Decimal KB. */
export const LIMITS: Readonly<Record<string, number>> = {
  'hero/video.webm': 700_000,
  'hero/video.mp4': 700_000,
  'hero/poster.avif': 60_000,
  'hero/poster.webp': 60_000,
  'art/glyph-phone.avif': 60_000,
  'art/glyph-web.avif': 60_000,
};

export type MediaManifest = {
  generatedAt: string;
  paramsHash: string;
  seed: number;
  /** File name relative to `apps/web/public` -> bytes. */
  files: Record<string, number>;
  /** PSNR (dB) of the first vs the last frame of the video, kept for the record. */
  loopPsnr?: number;
};

export type MediaCheck = { ok: boolean; errors: string[] };

/** Pure part of `hero:media:check`: the manifest must carry the current hash and every file must be within its limit. */
export function checkMedia(manifest: MediaManifest, expectedHash: string): MediaCheck {
  const errors: string[] = [];
  if (manifest.paramsHash !== expectedHash) {
    errors.push(`paramsHash ${manifest.paramsHash} does not match ${expectedHash}: run "pnpm hero:media" to regenerate`);
  }
  for (const [name, limit] of Object.entries(LIMITS)) {
    const bytes = manifest.files[name];
    if (bytes === undefined) errors.push(`${name} is missing from the manifest`);
    else if (bytes > limit) errors.push(`${name} is ${bytes} bytes, over the ${limit / 1000} KB limit`);
  }
  return { ok: errors.length === 0, errors };
}

/** Disk part: every file of the manifest exists in `publicDir` with exactly the recorded bytes. */
export function checkMediaFiles(manifest: MediaManifest, publicDir: string): MediaCheck {
  const errors: string[] = [];
  for (const [name, bytes] of Object.entries(manifest.files)) {
    const path = join(publicDir, name);
    if (!existsSync(path)) errors.push(`${name} does not exist in ${publicDir}`);
    else if (statSync(path).size !== bytes) errors.push(`${name} has ${statSync(path).size} bytes, the manifest says ${bytes}`);
  }
  return { ok: errors.length === 0, errors };
}
