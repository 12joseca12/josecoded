/**
 * `pnpm hero:media`: renders the hero video, the poster and the project art from the real scene (DT 1.6.3).
 * Playwright Chromium (SwiftShader) drives `render/harness.ts` frame by frame, ffmpeg encodes, sharp does the stills.
 * Only regenerates when `paramsHash` changed (`--force` to override). Output is committed under apps/web/public.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { build } from 'esbuild';
import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';


import { checkMedia, checkMediaFiles, LIMITS } from './check-media';
import { ART, FONT_FILE, MANIFEST_PATH, PUBLIC_DIR, ROOT, mediaHash } from './media-config';
import { bisect as bisectCrf, fit, glowToAlpha as glowPixels, psnr as psnrRaw } from './media-math';
import { CAPTURE, COUNT } from '../src/params';

import type { HarnessApi } from '../render/harness';
import type { MediaManifest } from '@josecoded/types';

const run = promisify(execFile);
const args = process.argv.slice(2);
const force = args.includes('--force');
const framesArg = args.indexOf('--frames-dir');
const keepFrames = framesArg >= 0;
const MIN_LOOP_PSNR = 35;
/** Page background (`--color-bg`): the poster is opaque, so no alpha channel is encoded. */
const POSTER_BG = '#07060f';
const log = (m: string) => console.log(`hero:media: ${m}`);

/* ---------- freshness ---------- */
const hash = mediaHash();
if (!force) {
  try {
    const old = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as MediaManifest;
    if (checkMedia(old, hash).ok && checkMediaFiles(old, PUBLIC_DIR).ok) {
      log(`up to date (paramsHash ${hash}); use --force to regenerate`);
      process.exit(0);
    }
  } catch {
    // no manifest yet: generate
  }
}

// Created only when generating (after the freshness check), so an up-to-date run leaves nothing behind.
const framesDir = framesArg >= 0 ? (args[framesArg + 1] as string) : mkdtempSync(join(tmpdir(), 'glyph-frames-'));

/* ---------- harness server ---------- */
async function serve(): Promise<{ server: Server; url: string }> {
  const bundle = await build({
    entryPoints: [join(ROOT, 'render/harness.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: false,
    logLevel: 'warning',
  });
  const js = bundle.outputFiles[0]?.text ?? '';
  const html = readFileSync(join(ROOT, 'render/index.html'));
  const font = readFileSync(FONT_FILE);
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    if (path === '/harness.js') res.writeHead(200, { 'content-type': 'text/javascript' }).end(js);
    else if (path === '/font.woff2') res.writeHead(200, { 'content-type': 'font/woff2' }).end(font);
    else if (path === '/') res.writeHead(200, { 'content-type': 'text/html' }).end(html);
    else res.writeHead(404).end();
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const addr = server.address();
  return { server, url: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}` };
}

type Opts = Parameters<HarnessApi['init']>[0];

/** One scene in its own page (a lost WebGL context cannot be reused), driven through `window.glyphHarness`. */
async function session(browser: Browser, url: string, viewport: { width: number; height: number }, o: Omit<Opts, 'fontName' | 'fontUrl'>) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  const init = await page.evaluate(
    (opts) => window.glyphHarness.init(opts),
    { ...o, fontName: 'Geist Mono Capture', fontUrl: '/font.woff2' } satisfies Opts,
  );
  if (!init.fontLoaded) throw new Error('Geist Mono did not load: the atlas would be painted with the fallback font');
  return {
    step: (dt: number) => page.evaluate((d) => window.glyphHarness.step(d), dt),
    stepPng: async (dt: number) =>
      Buffer.from((await page.evaluate((d) => window.glyphHarness.stepPng(d), dt)).replace(/^data:image\/png;base64,/, ''), 'base64'),
    close: () => page.close(),
  };
}

/* ---------- image helpers ---------- */
async function raw(png: Buffer) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, ...info };
}

const psnr = async (a: Buffer, b: Buffer) => psnrRaw((await raw(a)).data, (await raw(b)).data);

/** Additive glow on black -> straight-alpha PNG (see `glowToAlpha` in media-math). */
async function glowToAlpha(png: Buffer): Promise<Buffer> {
  const crop = sharp(png).extract({ left: Math.floor((ART.viewportWidth - ART.width) / 2), top: 0, width: ART.width, height: ART.height });
  const { data, width, height } = await raw(await crop.png().toBuffer());
  const rgba = glowPixels(data, width * height, ART.alpha.floor, ART.alpha.gain);
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/* ---------- video ---------- */
const tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const vf = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';

async function encode(codec: 'webm' | 'mp4', crf: number, out: string): Promise<number> {
  const input = ['-y', '-loglevel', 'error', '-framerate', String(CAPTURE.fps), '-start_number', '0', '-i', join(framesDir, '%04d.png'), '-vf', vf, ...tags];
  const video =
    codec === 'webm'
      ? ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2']
      : ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart'];
  await run('ffmpeg', [...input, ...video, '-an', out]);
  return statSync(out).size;
}

const bisect = async (codec: 'webm' | 'mp4', lo: number, hi: number, out: string, limit: number) =>
  bisectCrf((crf) => encode(codec, crf, out), lo, hi, limit, (crf, bytes) => log(`${codec} crf ${crf}: ${bytes} bytes`));

/** Versions of the tools that make the files, recorded in the manifest. */
async function generatorVersions(b: Browser): Promise<MediaManifest['generator']> {
  const ffmpeg = (await run('ffmpeg', ['-version'])).stdout.split('\n')[0]?.replace(/^ffmpeg version /, '').split(' ')[0] ?? 'unknown';
  return { chromium: b.version(), ffmpeg, sharp: sharp.versions.sharp };
}

/* ---------- main ---------- */
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const stage = mkdtempSync(join(tmpdir(), 'glyph-media-'));
try {
  mkdirSync(framesDir, { recursive: true });

  log(`capturing ${CAPTURE.frames} frames at ${CAPTURE.width}x${CAPTURE.height} (count ${COUNT.video})`);
  const video = await session(browser, url, { width: CAPTURE.width, height: CAPTURE.height }, { count: COUNT.video, seed: CAPTURE.seed, capture: true });
  const pngs: Buffer[] = [];
  for (let f = 0; f < CAPTURE.frames; f++) {
    const png = await video.stepPng(1 / CAPTURE.fps);
    writeFileSync(join(framesDir, `${String(f).padStart(4, '0')}.png`), png);
    if (f === 0 || f === CAPTURE.frames - 2 || f === CAPTURE.frames - 1) pngs.push(png);
    if (f % 60 === 0) log(`frame ${f}`);
  }
  await video.close();

  const [first, beforeLast, last] = pngs as [Buffer, Buffer, Buffer];
  const loopPsnr = await psnr(first, last);
  const seamPsnr = await psnr(beforeLast, last);
  log(`loop PSNR frame 0 vs ${CAPTURE.frames - 1}: ${loopPsnr.toFixed(2)} dB; seam ${CAPTURE.frames - 2} -> ${CAPTURE.frames - 1}: ${seamPsnr.toFixed(2)} dB`);
  if (loopPsnr < MIN_LOOP_PSNR) throw new Error(`loop does not close: PSNR ${loopPsnr.toFixed(2)} dB < ${MIN_LOOP_PSNR} dB`);

  log(`capturing the poster (frame ${CAPTURE.posterFrame}, count ${COUNT.desktop})`);
  const posterScene = await session(browser, url, { width: CAPTURE.width, height: CAPTURE.height }, { count: COUNT.desktop, seed: CAPTURE.seed, capture: true });
  for (let f = 0; f < CAPTURE.posterFrame; f++) await posterScene.step(1 / CAPTURE.fps);
  const posterPng = await posterScene.stepPng(1 / CAPTURE.fps);
  await posterScene.close();

  const art: Record<'phone' | 'web', Buffer> = { phone: Buffer.alloc(0), web: Buffer.alloc(0) };
  for (const name of ['phone', 'web'] as const) {
    log(`capturing the ${name} art (${ART.width}x${ART.height})`);
    const s = await session(browser, url, { width: ART.viewportWidth, height: ART.height }, { count: COUNT.desktop, seed: CAPTURE.seed, capture: false, background: '#000000', params: { rot: 0 }, pose: { rotY: ART[name].rotY }, stageHeight: ART.stage.height, stageOffsetY: ART.stage.offsetY });
    const steps = ART[name].steps;
    for (const dt of steps.slice(0, -1)) await s.step(dt);
    art[name] = await glowToAlpha(await s.stepPng(steps[steps.length - 1] as number));
    await s.close();
  }

  log('encoding video');
  const webmCrf = await bisect('webm', 20, 63, join(stage, 'video.webm'), LIMITS['hero/video.webm'] as number);
  const mp4Crf = await bisect('mp4', 16, 51, join(stage, 'video.mp4'), LIMITS['hero/video.mp4'] as number);

  log('encoding stills');
  const out: Record<string, Buffer> = {
    'hero/video.webm': readFileSync(join(stage, 'video.webm')),
    'hero/video.mp4': readFileSync(join(stage, 'video.mp4')),
    'hero/poster.avif': Buffer.from(await fit('poster.avif', (q) => sharp(posterPng).flatten({ background: POSTER_BG }).avif({ quality: q, effort: 6 }).toBuffer(), 50, LIMITS['hero/poster.avif'] as number)),
    'hero/poster.webp': Buffer.from(await fit('poster.webp', (q) => sharp(posterPng).flatten({ background: POSTER_BG }).webp({ quality: q, effort: 6 }).toBuffer(), 78, LIMITS['hero/poster.webp'] as number)),
    'art/glyph-phone.avif': Buffer.from(await fit('glyph-phone.avif', (q) => sharp(art.phone).avif({ quality: q, effort: 6 }).toBuffer(), 60, LIMITS['art/glyph-phone.avif'] as number)),
    'art/glyph-web.avif': Buffer.from(await fit('glyph-web.avif', (q) => sharp(art.web).avif({ quality: q, effort: 6 }).toBuffer(), 60, LIMITS['art/glyph-web.avif'] as number)),
  };

  const files: MediaManifest['files'] = {};
  for (const [name, buf] of Object.entries(out)) {
    const path = join(PUBLIC_DIR, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, buf);
    files[name] = { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
    log(`${name}: ${buf.length} bytes`);
  }
  const manifest: MediaManifest = { generatedAt: new Date().toISOString(), paramsHash: hash, seed: CAPTURE.seed, files, loopPsnr: Number(loopPsnr.toFixed(2)), generator: await generatorVersions(browser) };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  log(`done (webm crf ${webmCrf}, mp4 crf ${mp4Crf}, paramsHash ${hash})`);
} finally {
  await browser.close();
  server.close();
  rmSync(stage, { recursive: true, force: true });
  if (!keepFrames) rmSync(framesDir, { recursive: true, force: true });
}
