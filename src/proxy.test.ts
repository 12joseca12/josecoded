import { describe, expect, it } from "vitest";

import { config } from "./proxy";

const entry = config.matcher[0] ?? "";
const pattern = new RegExp(`^${typeof entry === "string" ? entry : entry.source}$`);

describe("proxy matcher", () => {
  it("covers pages, including paths that contain a dot", () => {
    for (const path of [
      "/es",
      "/es/admin",
      "/es/entrar/totp",
      "/es/servicios/packs",
      "/es/a.b/c",
    ]) {
      expect(pattern.test(path)).toBe(true);
    }
  });

  it("skips static files and metadata routes by extension", () => {
    for (const path of [
      "/favicon.ico",
      "/logo.png",
      "/fonts/a.woff2",
      "/robots.txt",
      "/llms.txt",
      "/sitemap.xml",
      "/site.webmanifest",
      "/_next/static/chunks/a.js",
      "/api/x",
    ]) {
      expect(pattern.test(path)).toBe(false);
    }
  });
});
