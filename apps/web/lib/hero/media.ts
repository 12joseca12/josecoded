import { mediaManifestSchema } from '@josecoded/types';

import manifestJson from '@/public/hero/media.json';

// The hero media (`pnpm hero:media`, task 2.6) are committed under `public/hero/` with a manifest.
// The manifest is validated here with the same zod schema `hero:media:check` uses, so a build
// breaks on a malformed or incomplete one instead of serving a hero without its poster.

const manifest = mediaManifestSchema.parse(manifestJson);

const REQUIRED = ['hero/poster.avif', 'hero/poster.webp', 'hero/video.webm', 'hero/video.mp4'] as const;
for (const name of REQUIRED) {
  if (!(name in manifest.files)) throw new Error(`public/hero/media.json has no entry for ${name}`);
}

export interface HeroMedia {
  /** Side of the square the poster and the video were rendered at. */
  size: number;
  posterAvif: string;
  posterWebp: string;
  videoWebm: string;
  videoMp4: string;
}

/** The poster and the video are 720 x 720 (DT §1.6.3); `version` is the `?v=` cache buster. */
export function heroMedia(version: string): HeroMedia {
  const url = (name: (typeof REQUIRED)[number]) => `/${name}?v=${encodeURIComponent(version)}`;
  return {
    size: 720,
    posterAvif: url('hero/poster.avif'),
    posterWebp: url('hero/poster.webp'),
    videoWebm: url('hero/video.webm'),
    videoMp4: url('hero/video.mp4'),
  };
}
