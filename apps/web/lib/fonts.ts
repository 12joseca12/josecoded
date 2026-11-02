import { Geist } from 'next/font/google';
import localFont from 'next/font/local';

// Geist for everything, Geist Mono only in keys, the language link, {{DATO}} markers and glyphs
// (DESIGN.md «The One Family Rule»). next/font downloads the files at build time and serves them
// from the app itself (no request to Google at runtime), with a metric-adjusted fallback face so the
// swap does not move the layout. The family names it generates are hashed, so each font is exposed
// as a custom property and `styles/globals.css` points `--font-sans` / `--font-mono` at them.

/** Variable font: the 400, 500, 550 and 600 weights of the design are all served by one file. */
export const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

/**
 * Geist Mono (OFL, licence beside it) as a Latin subset of the vendored variable file the hero media are rendered with
 * (`packages/glyph-scene/render/GeistMono-Variable.woff2`): 14 KB instead of 70 KB, because the lang link is on the
 * first screen of every page and its file competes with the CSS and the poster (the LCP on phones). The glyph atlas of
 * the live scene is plain ASCII (`CHARS`), so the outlines are the same bytes of design. Characters outside the subset
 * fall to the fallback monospace. Regenerate with fonttools:
 *
 *   pyftsubset GeistMono-Variable.woff2 --flavor=woff2 --no-hinting --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
 *     --unicodes='U+0020-007E,U+00A0,U+00A1,U+00BF,U+00C1,U+00C9,U+00CD,U+00D1,U+00D3,U+00DA,U+00DC,U+00E1,U+00E9,U+00ED,U+00F1,U+00F3,U+00FA,U+00FC,U+00B7,U+00D7,U+20AC,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2190-2193,U+21B5,U+21E7,U+2318,U+2325' \
 *     --output-file=GeistMono-Subset.woff2
 *
 * Not preloaded: it paints nothing of the poster path, and a preload would take bandwidth from it.
 */
export const geistMono = localFont({
  src: './fonts/GeistMono-Subset.woff2',
  weight: '100 900',
  display: 'swap',
  preload: false,
  variable: '--font-geist-mono',
  fallback: ['ui-monospace', 'SF Mono', 'monospace'],
});

/** Class names for `<html>`: they define `--font-geist` and `--font-geist-mono` on it. */
export const fontVariables = `${geist.variable} ${geistMono.variable}`;
