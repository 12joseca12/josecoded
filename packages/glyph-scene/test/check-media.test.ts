import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { checkMedia, checkMediaFiles, type MediaManifest } from '../scripts/check-media';

const ok: MediaManifest = {
  generatedAt: '2026-09-30',
  paramsHash: 'deadbeefdeadbeef',
  seed: 1,
  files: {
    'hero/video.webm': 300000,
    'hero/video.mp4': 350000,
    'hero/poster.avif': 40000,
    'hero/poster.webp': 55000,
    'art/glyph-phone.avif': 50000,
    'art/glyph-web.avif': 52000,
  },
};

it('fails when paramsHash differs or a file exceeds its limit', () => {
  expect(checkMedia(ok, 'deadbeefdeadbeef')).toEqual({ ok: true, errors: [] });
  expect(checkMedia({ ...ok, paramsHash: '0000000000000000' }, 'deadbeefdeadbeef').errors[0]).toMatch(/paramsHash/);
  // Video cap is 700 KB (Jose, 2026-09-30; spec 12.3), not the 400 KB of the plan's original test.
  expect(checkMedia({ ...ok, files: { ...ok.files, 'hero/video.webm': 700000 } }, 'deadbeefdeadbeef').ok).toBe(true);
  expect(checkMedia({ ...ok, files: { ...ok.files, 'hero/video.webm': 700001 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/video\.webm.*700/);
  expect(checkMedia({ ...ok, files: { ...ok.files, 'art/glyph-web.avif': 61441 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/glyph-web.*60/);
});

it('fails when a required file is missing from the manifest', () => {
  const files = { ...ok.files };
  delete files['hero/poster.avif'];
  expect(checkMedia({ ...ok, files }, 'deadbeefdeadbeef').errors[0]).toMatch(/poster\.avif.*missing/);
});

it('checks that each listed file exists with exactly the recorded bytes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-media-'));
  try {
    mkdirSync(join(dir, 'hero'));
    writeFileSync(join(dir, 'hero/poster.webp'), Buffer.alloc(10));
    const manifest = { ...ok, files: { 'hero/poster.webp': 10, 'hero/poster.avif': 5 } };
    expect(checkMediaFiles(manifest, dir).errors).toEqual([expect.stringMatching(/poster\.avif.*does not exist/)]);
    expect(checkMediaFiles({ ...manifest, files: { 'hero/poster.webp': 11 } }, dir).errors[0]).toMatch(/poster\.webp.*10 bytes.*11/);
    expect(checkMediaFiles({ ...manifest, files: { 'hero/poster.webp': 10 } }, dir).ok).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
