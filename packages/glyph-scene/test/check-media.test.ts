import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { checkMedia, checkMediaFiles, type MediaManifest } from '../scripts/check-media';
import { ROOT, hashedFiles, mediaHash } from '../scripts/media-config';

const f = (bytes: number) => ({ bytes, sha256: 'a'.repeat(64) });
const ok: MediaManifest = {
  generatedAt: '2026-09-30',
  paramsHash: 'deadbeefdeadbeef',
  seed: 1,
  files: {
    'hero/video.webm': f(300000),
    'hero/video.mp4': f(350000),
    'hero/poster.avif': f(40000),
    'hero/poster.webp': f(55000),
    'hero/poster-sm.avif': f(30000),
    'art/glyph-phone.avif': f(50000),
    'art/glyph-web.avif': f(52000),
  },
  generator: { chromium: '1.0', ffmpeg: '7.0', sharp: '0.35' },
};

it('fails when paramsHash differs or a file exceeds its limit', () => {
  expect(checkMedia(ok, 'deadbeefdeadbeef')).toEqual({ ok: true, errors: [] });
  expect(checkMedia({ ...ok, paramsHash: '0000000000000000' }, 'deadbeefdeadbeef').errors[0]).toMatch(/paramsHash/);
  // Video cap is 700 KB (Jose, 2026-09-30; spec 12.3), not the 400 KB of the plan's original test.
  expect(checkMedia({ ...ok, files: { ...ok.files, 'hero/video.webm': f(700000) } }, 'deadbeefdeadbeef').ok).toBe(true);
  expect(checkMedia({ ...ok, files: { ...ok.files, 'hero/video.webm': f(700001) } }, 'deadbeefdeadbeef').errors[0]).toMatch(/video\.webm.*700/);
  expect(checkMedia({ ...ok, files: { ...ok.files, 'art/glyph-web.avif': f(61441) } }, 'deadbeefdeadbeef').errors[0]).toMatch(/glyph-web.*60/);
});

it('fails when a required file is missing from the manifest', () => {
  const files = { ...ok.files };
  delete files['hero/poster.avif'];
  expect(checkMedia({ ...ok, files }, 'deadbeefdeadbeef').errors[0]).toMatch(/poster\.avif.*missing/);
});

it('checks that each listed file exists with exactly the recorded bytes and sha256', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-media-'));
  try {
    mkdirSync(join(dir, 'hero'));
    const body = Buffer.alloc(10, 7);
    writeFileSync(join(dir, 'hero/poster.webp'), body);
    const sha256 = createHash('sha256').update(body).digest('hex');
    const manifest = { ...ok, files: { 'hero/poster.webp': { bytes: 10, sha256 }, 'hero/poster.avif': f(5) } };
    expect(checkMediaFiles(manifest, dir).errors).toEqual([expect.stringMatching(/poster\.avif.*does not exist/)]);
    expect(checkMediaFiles({ ...manifest, files: { 'hero/poster.webp': { bytes: 11, sha256 } } }, dir).errors[0]).toMatch(/poster\.webp.*10 bytes.*11/);
    expect(checkMediaFiles({ ...manifest, files: { 'hero/poster.webp': { bytes: 10, sha256 } } }, dir).ok).toBe(true);
    // same size, different content: only the digest notices
    expect(checkMediaFiles({ ...manifest, files: { 'hero/poster.webp': { bytes: 10, sha256: 'b'.repeat(64) } } }, dir).errors[0]).toMatch(/sha256/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('hashes the whole pipeline: src, render (font included) and the media scripts, not the tests', () => {
  const files = hashedFiles();
  for (const expected of ['scripts/render-media.ts', 'src/cloud-loader.ts', 'src/intro.ts', 'src/index.ts', 'render/GeistMono-Variable.woff2', 'render/harness.ts'])
    expect(files).toContain(expected);
  expect(files.some((p) => /\.test\./.test(p))).toBe(false);
});

it('mutating render-media.ts, a src module or the font changes the hash', () => {
  const copy = mkdtempSync(join(tmpdir(), 'media-hash-'));
  try {
    for (const rel of hashedFiles()) {
      mkdirSync(join(copy, rel, '..'), { recursive: true });
      cpSync(join(ROOT, rel), join(copy, rel));
    }
    const base = mediaHash(copy);
    expect(mediaHash(ROOT)).toBe(base);
    for (const rel of ['scripts/render-media.ts', 'src/intro.ts', 'render/GeistMono-Variable.woff2']) {
      const path = join(copy, rel);
      const original = readFileSync(path);
      writeFileSync(path, Buffer.concat([original, Buffer.from('\n// changed')]));
      expect(mediaHash(copy), rel).not.toBe(base);
      writeFileSync(path, original);
    }
    expect(mediaHash(copy)).toBe(base);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
});
