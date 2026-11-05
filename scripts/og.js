import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ImageResponse } from "next/og.js";

import { publishedLocales } from "../src/i18n/config.ts";
import {
  ogDirectory,
  ogImagePath,
  ogPalette,
  ogSize,
  ogTitleKeys,
  ogTitleSize,
} from "../src/lib/seo/og.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

function lookup(tree, key) {
  const value = key.split(".").reduce((node, part) => node?.[part], tree);
  if (typeof value !== "string") throw new Error(`og: missing message "${key}"`);
  return value;
}

function element(type, style, children) {
  return { type, props: { style: { display: "flex", ...style }, children } };
}

function card({ brand, title, byline }) {
  return element(
    "div",
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 80px",
      background: ogPalette.charcoal,
      fontFamily: "Inter Tight",
    },
    [
      element("div", { alignItems: "center", gap: 16 }, [
        element("div", { width: 56, height: 6, background: ogPalette.coral }, ""),
        element("div", { fontSize: 30, fontWeight: 600, color: ogPalette.steel }, brand),
      ]),
      element(
        "div",
        {
          fontSize: ogTitleSize(title),
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: ogPalette.onDark,
        },
        title,
      ),
      element("div", { fontSize: 32, fontWeight: 400, color: ogPalette.steel }, byline),
    ],
  );
}

function font(weight) {
  const file = readFileSync(join(root, "src/fonts", `inter-tight-latin-${weight}.ttf`));
  return new Uint8Array(file).buffer;
}

const fonts = [
  { name: "Inter Tight", data: font(400), weight: 400, style: "normal" },
  { name: "Inter Tight", data: font(600), weight: 600, style: "normal" },
];

const outputDirectory = join(root, "public", ogDirectory);
let stale = 0;

for (const locale of publishedLocales) {
  const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
  const brand = lookup(messages, "meta.siteName");
  const byline = lookup(messages, "og.byline");
  for (const [page, key] of Object.entries(ogTitleKeys)) {
    const response = new ImageResponse(card({ brand, title: lookup(messages, key), byline }), {
      ...ogSize,
      fonts,
    });
    const png = Buffer.from(await response.arrayBuffer());
    const file = join(root, "public", ogImagePath(locale, page));
    if (check) {
      if (!existsSync(file) || !readFileSync(file).equals(png)) {
        console.error(`og: ${file} is out of date`);
        stale += 1;
      }
    } else {
      mkdirSync(outputDirectory, { recursive: true });
      writeFileSync(file, png);
    }
  }
}

if (check && stale > 0) {
  console.error("og: run pnpm og:build");
  process.exit(1);
}
console.log(check ? "og: images are up to date" : "og: wrote images to public/og");
