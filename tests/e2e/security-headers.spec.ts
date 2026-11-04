import { expect, type Page, test } from "@playwright/test";

const publicRoutes = ["/es", "/es/contacto", "/es/servicios", "/es/proyectos"];
const devRoutes = ["/es/dev/nexo", "/es/dev/ui"];
const devPagesEnabled = process.env.ENABLE_DEV_PAGES === "true";

function nonceOf(csp: string | undefined): string {
  const match = /'nonce-([^']+)'/.exec(csp ?? "");
  return match?.[1] ?? "";
}

async function recordViolations(page: Page) {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  await page.exposeFunction("reportCspViolation", (detail: string) => {
    violations.push(detail);
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (window as unknown as { reportCspViolation: (detail: string) => void })
        .reportCspViolation;
      report(`${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}`);
    });
  });
  return violations;
}

for (const path of publicRoutes) {
  test(`${path} sends the security headers`, async ({ request }) => {
    const response = await request.get(path);
    const headers = response.headers();
    const csp = headers["content-security-policy"];
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("'strict-dynamic' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["permissions-policy"]).toContain("microphone=()");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["strict-transport-security"]).toBeUndefined();
  });
}

test("the nonce is fresh per request and stamped on every script", async ({ request }) => {
  const first = await request.get("/es");
  const second = await request.get("/es");
  const firstNonce = nonceOf(first.headers()["content-security-policy"]);
  const secondNonce = nonceOf(second.headers()["content-security-policy"]);
  expect(firstNonce).not.toBe("");
  expect(firstNonce).not.toBe(secondNonce);
  const html = await first.text();
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]);
  expect(scripts.length).toBeGreaterThan(0);
  for (const tag of scripts) expect(tag).toContain(`nonce="${firstNonce}"`);
  expect(scripts.some((tag) => tag.includes("application/ld+json"))).toBe(true);
});

test("X-Robots-Tag survives next to the security headers on dev routes", async ({ request }) => {
  test.skip(!devPagesEnabled, "dev pages are disabled");
  const response = await request.get("/es/dev/ui");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  expect(response.headers()["content-security-policy"]).toContain("'nonce-");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

test("static assets keep the baseline headers", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

for (const path of [...publicRoutes, ...devRoutes]) {
  test(`${path} raises no CSP violation`, async ({ page }) => {
    test.skip(devRoutes.includes(path) && !devPagesEnabled, "dev pages are disabled");
    const violations = await recordViolations(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight;
      for (let top = 0; top <= height; top += window.innerHeight) {
        window.scrollTo(0, top);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    });
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
  });
}

test("the Turnstile widget mounts and a view transition runs without violations", async ({
  page,
}) => {
  const violations = await recordViolations(page);
  await page.goto("/es/contacto#formulario");
  await expect(page.locator("#formulario [data-fake-turnstile]")).toBeAttached();
  await page.getByRole("link", { name: "Servicios" }).first().click();
  await page.waitForURL("**/es/servicios");
  await page.waitForLoadState("networkidle");
  expect(violations).toEqual([]);
});

test("the Nexo lazy chunk loads under the nonce policy", async ({ page }) => {
  test.skip(!devPagesEnabled, "dev pages are disabled");
  const violations = await recordViolations(page);
  const scripts: string[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") scripts.push(response.url());
  });
  await page.goto("/es/dev/nexo");
  await page.waitForLoadState("networkidle");
  expect(scripts.length).toBeGreaterThan(0);
  expect(violations).toEqual([]);
});
