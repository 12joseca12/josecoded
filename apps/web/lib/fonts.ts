import { Geist, Geist_Mono } from 'next/font/google';

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

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
  variable: '--font-geist-mono',
  fallback: ['ui-monospace', 'SF Mono', 'monospace'],
});

/** Class names for `<html>`: they define `--font-geist` and `--font-geist-mono` on it. */
export const fontVariables = `${geist.variable} ${geistMono.variable}`;
