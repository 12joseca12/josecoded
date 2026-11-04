import { describe, expect, it } from "vitest";

import { buildCsp, buildHeaders, productionHostPattern } from "@/config/headers";
import { productionOrigin, resolveSite } from "@/config/site";

const production = resolveSite({ NEXT_PUBLIC_SITE_URL: productionOrigin });
const preview = resolveSite({
  NEXT_PUBLIC_SITE_URL: "https://josecoded-preview.josecoded-api.workers.dev",
});

function matchesHost(pattern: string | undefined, host: string) {
  return new RegExp(`^${pattern ?? ""}$`).test(host);
}

function directive(csp: string, name: string) {
  const found = csp.split("; ").find((part) => part === name || part.startsWith(`${name} `));
  return found?.split(" ").slice(1) ?? null;
}

describe("buildHeaders", () => {
  it("noindexes dev pages and workers.dev hosts even in production", () => {
    const rules = buildHeaders(production);
    const dev = rules.find((rule) => rule.source === "/:locale/dev/:path*");
    expect(dev?.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    const workers = rules.find((rule) =>
      rule.headers.some((header) => header.key === "X-Robots-Tag" && rule.has),
    );
    expect(
      matchesHost(workers?.has?.[0]?.value, "josecoded-preview.josecoded-api.workers.dev"),
    ).toBe(true);
    expect(matchesHost(workers?.has?.[0]?.value, "josecoded.com")).toBe(false);
  });

  it("noindexes everything on non-production builds", () => {
    const rules = buildHeaders(preview);
    expect(rules).toContainEqual({
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    });
    const unconditional = (list: ReturnType<typeof buildHeaders>) =>
      list.filter(
        (rule) => !rule.has && rule.headers.some((header) => header.key === "X-Robots-Tag"),
      );
    expect(unconditional(buildHeaders(production))).toHaveLength(1);
    expect(unconditional(rules)).toHaveLength(2);
  });

  it("sends the baseline security headers on every route", () => {
    const rule = buildHeaders(production).find(
      (candidate) => !candidate.has && candidate.headers.some((h) => h.key === "Referrer-Policy"),
    );
    expect(rule?.source).toBe("/:path*");
    const byKey = Object.fromEntries(rule?.headers.map((h) => [h.key, h.value]) ?? []);
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
      expect(byKey["Permissions-Policy"]).toContain(`${feature}=()`);
    }
  });

  it("sends HSTS only on the production host and its subdomains", () => {
    const rules = buildHeaders(production);
    const hsts = rules.filter((rule) =>
      rule.headers.some((h) => h.key === "Strict-Transport-Security"),
    );
    expect(hsts).toHaveLength(1);
    expect(hsts[0]?.headers).toEqual([
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ]);
    const pattern = hsts[0]?.has?.[0]?.value;
    expect(pattern).toBe(productionHostPattern);
    expect(matchesHost(pattern, "josecoded.com")).toBe(true);
    expect(matchesHost(pattern, "www.josecoded.com")).toBe(true);
    expect(matchesHost(pattern, "localhost")).toBe(false);
    expect(matchesHost(pattern, "evil-josecoded.com")).toBe(false);
    expect(matchesHost(pattern, "josecoded.com.evil.test")).toBe(false);
    expect(matchesHost(pattern, "josecoded-preview.josecoded-api.workers.dev")).toBe(false);
  });
});

describe("buildCsp", () => {
  const csp = buildCsp({ nonce: "abc123", development: false });

  it("allows scripts only by nonce, strict-dynamic and the Turnstile origin", () => {
    expect(directive(csp, "script-src")).toEqual([
      "'self'",
      "'nonce-abc123'",
      "'strict-dynamic'",
      "https://challenges.cloudflare.com",
    ]);
    expect(csp).not.toContain("unsafe-eval");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
  });

  it("locks every other fetch and navigation directive down", () => {
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "frame-src")).toEqual(["https://challenges.cloudflare.com"]);
    expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    expect(directive(csp, "img-src")).toEqual(["'self'", "data:"]);
    expect(directive(csp, "font-src")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "upgrade-insecure-requests")).toEqual([]);
  });

  it("keeps inline styles to attributes and nonced style elements", () => {
    expect(directive(csp, "style-src")).toEqual(["'self'", "'nonce-abc123'"]);
    expect(directive(csp, "style-src-attr")).toEqual(["'unsafe-inline'"]);
  });

  it("uses the nonce it is given", () => {
    expect(buildCsp({ nonce: "other", development: false })).toContain("'nonce-other'");
    expect(buildCsp({ nonce: "other", development: false })).not.toContain("abc123");
  });

  it("relaxes only eval, websockets and https upgrade in development", () => {
    const dev = buildCsp({ nonce: "abc123", development: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toEqual(["'self'", "ws:", "wss:"]);
    expect(directive(dev, "upgrade-insecure-requests")).toBeNull();
  });
});
