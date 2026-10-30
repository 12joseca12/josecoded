import { z } from 'zod';

// `apps/web/public/hero/media.json`, written by `pnpm hero:media` (glyph-scene) and read by `hero:media:check`.

export const mediaFileSchema = z.object({
  bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export const mediaManifestSchema = z.object({
  generatedAt: z.string().min(1),
  paramsHash: z.string().regex(/^[0-9a-f]{16}$/),
  seed: z.number().int(),
  /** File name relative to `apps/web/public` -> size and digest of the committed file. */
  files: z.record(z.string().min(1), mediaFileSchema),
  /** PSNR (dB) of the first vs the last frame of the video, kept for the record. */
  loopPsnr: z.number().optional(),
  /** Tool versions that produced the files, for traceability when a regeneration looks different. */
  generator: z.object({
    chromium: z.string().min(1),
    ffmpeg: z.string().min(1),
    sharp: z.string().min(1),
  }),
});

export type MediaFile = z.infer<typeof mediaFileSchema>;
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
