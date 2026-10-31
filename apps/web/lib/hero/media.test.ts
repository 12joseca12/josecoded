import { expect, it } from 'vitest';

import { heroMedia } from './media';

it('validates the committed manifest and builds versioned URLs for the four files', () => {
  const media = heroMedia('3');
  expect(media.posterAvif).toBe('/hero/poster.avif?v=3');
  expect(media.posterWebp).toBe('/hero/poster.webp?v=3');
  expect(media.videoWebm).toBe('/hero/video.webm?v=3');
  expect(media.videoMp4).toBe('/hero/video.mp4?v=3');
  expect(media.size).toBe(720);
});
