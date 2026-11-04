import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  breadcrumbs: { label: string };
  services: {
    nav: { label: string };
    how: { title: string };
    faq: { title: string };
    bento: { title: string };
    ways: Record<"contratacion" | "freelance" | "packs", { nav: string }>;
  };
};
const wayNav = es.services.nav.label;
const ways = es.services.ways;
const origin = "https://josecoded.com";
const siteOrigin = "http://localhost:3000";

interface Node {
  "@type": string;
  [key: string]: unknown;
}

async function readNodes(page: Page): Promise<Node[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text) => (JSON.parse(text) as { "@graph": Node[] })["@graph"]);
}

const pages = [
  { name: "hub", path: "/es/servicios", crumbs: ["Inicio", "Servicios"], faq: 4 },
  {
    name: "freelance",
    path: "/es/servicios/freelance",
    crumbs: ["Inicio", "Servicios", "Freelance"],
    faq: 4,
  },
  {
    name: "packs",
    path: "/es/servicios/packs",
    crumbs: ["Inicio", "Servicios", "Packs"],
    faq: 5,
  },
] as const;

for (const entry of pages) {
  for (const width of [1440, 390]) {
    test(`${entry.name} passes axe at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(entry.path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.locator("details").first().locator("summary").click();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }

  test(`${entry.name} has one h1, a canonical and the section blocks`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${entry.path}`,
    );
    const blocks = page.locator("section[data-block]");
    expect(await blocks.count()).toBeGreaterThanOrEqual(3);
    for (const heading of await page.getByRole("heading", { level: 2 }).all()) {
      await expect(heading).toBeVisible();
    }
  });

  test(`${entry.name} shows the breadcrumb and declares BreadcrumbList`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(entry.path);
    const crumbs = page.getByRole("navigation", { name: es.breadcrumbs.label });
    await expect(crumbs.getByRole("listitem")).toHaveText([...entry.crumbs]);
    await expect(crumbs.locator("[aria-current='page']")).toHaveText(entry.crumbs.at(-1) ?? "");
    const nodes = await readNodes(page);
    const list = nodes.find((node) => node["@type"] === "BreadcrumbList");
    const items = list?.itemListElement as { position: number; name: string; item: string }[];
    expect(items.map((item) => item.name)).toEqual([...entry.crumbs]);
    expect(items.map((item) => item.position)).toEqual(entry.crumbs.map((_, i) => i + 1));
    expect(items.at(-1)?.item).toBe(`${siteOrigin}${entry.path}`);
  });

  test(`${entry.name} FAQ toggles with the keyboard and matches FAQPage`, async ({ page }) => {
    await page.goto(entry.path);
    const items = page.locator("details");
    await expect(items).toHaveCount(entry.faq);
    const first = items.first();
    await expect(first).not.toHaveAttribute("open", "");
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(first).not.toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("open", "");
    await page.keyboard.press("Tab");
    await expect(items.nth(1).locator("summary")).toBeFocused();

    const nodes = await readNodes(page);
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    const questions = (faq?.mainEntity as { name: string }[]).map((q) => q.name);
    const visible = await items.locator("summary span:first-child").allTextContents();
    expect(questions).toEqual(visible);
  });

  test(`${entry.name} JSON-LD carries no provisional figure`, async ({ page }) => {
    await page.goto(entry.path);
    const raw = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
      "",
    );
    expect(raw).not.toMatch(/"(price|lowPrice|minPrice)"/);
    expect(raw).not.toContain("€");
    expect(raw).not.toMatch(/"(text|name)":"[^"]*\b0{2,3}\b/);
  });

  test(`${entry.name} JSON-LD scripts carry the CSP nonce`, async ({ page }) => {
    await page.goto(entry.path);
    const scripts = page.locator('script[type="application/ld+json"]');
    expect(await scripts.count()).toBeGreaterThanOrEqual(2);
    for (const script of await scripts.all()) {
      const nonce = await script.evaluate((node) => (node as HTMLScriptElement).nonce);
      expect(nonce.length).toBeGreaterThan(0);
    }
  });
}

test("hub frames the ways as needs and keeps the five phases only here", async ({ page }) => {
  await page.goto("/es/servicios");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    es.services.bento.title,
    es.services.how.title,
    es.services.faq.title,
  ]);
  await expect(page.locator("#vias article")).toHaveCount(4);
  await expect(page.locator("#vias h3")).toHaveCount(4);
  const steps = page.locator("#como-trabajo ol > li");
  await expect(steps).toHaveCount(5);
  await expect(steps.locator("h3")).toHaveText([
    "Descubrir",
    "Diseñar",
    "Construir",
    "Publicar",
    "Mantener",
  ]);
  for (const path of ["/es/servicios/freelance", "/es/servicios/packs"]) {
    await page.goto(path);
    await expect(page.locator("#como-trabajo")).toHaveCount(0);
  }
});

test("hub tiles link to their destinations with unified params", async ({ page }) => {
  await page.goto("/es/servicios");
  const hiring = page.locator("#contratacion");
  await expect(hiring.getByRole("link").first()).toHaveAttribute(
    "href",
    "/es/contacto?via=hiring#formulario",
  );
  await expect(hiring.getByRole("link").nth(1)).toHaveAttribute("href", "/es/sobre-mi");
  await expect(page.locator("#freelance").getByRole("link")).toHaveAttribute(
    "href",
    "/es/servicios/freelance",
  );
  await expect(page.locator("#packs").getByRole("link")).toHaveAttribute(
    "href",
    "/es/servicios/packs",
  );
});

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 375, height: 812 }],
] as const) {
  test(`hub tiles are keyboard reachable, whole-tile clickable and axe-clean on ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/es/servicios");
    const links = page.locator("#vias a");
    const count = await links.count();
    expect(count).toBe(6);
    for (const link of await links.all()) {
      await link.focus();
      await expect(link).toBeFocused();
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    }
    await page.locator("#freelance a").first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/es\/servicios\/freelance$/);
    await page.goBack();
    await page.locator("#packs").evaluate((el) => {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 140 });
    });
    await page.waitForTimeout(700);
    const box = await page.locator("#packs").boundingBox();
    if (!box) throw new Error("packs tile has no box");
    await page.mouse.click(box.x + 40, box.y + 40);
    await expect(page).toHaveURL(/\/es\/servicios\/packs$/);
    await page.goBack();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
  });
}

test("hub bento is three columns plus the stack strip on desktop and one column at 375", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es/servicios");
  const need = await page
    .locator("#contratacion, #packs, #freelance")
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
  expect(new Set(need).size).toBe(1);
  const proof = await page.locator("#vias article").last().boundingBox();
  const hiring = await page.locator("#contratacion").boundingBox();
  expect(proof?.y ?? 0).toBeGreaterThan((hiring?.y ?? 0) + (hiring?.height ?? 0));
  expect(proof?.width ?? 0).toBeGreaterThan((hiring?.width ?? 0) * 2.5);
  await page.setViewportSize({ width: 375, height: 812 });
  const lefts = await page
    .locator("#vias article")
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().left)));
  expect(new Set(lefts).size).toBe(1);
});

test("a hub tile lifts and gets a coral edge on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es/servicios");
  const tile = page.locator("#freelance");
  await tile.scrollIntoViewIfNeeded();
  const before = await tile.evaluate((el) => getComputedStyle(el).borderTopColor);
  await tile.hover();
  await expect
    .poll(() => tile.evaluate((el) => getComputedStyle(el).borderTopColor))
    .not.toBe(before);
  await expect.poll(() => tile.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");
});

test("FAQ opens with a height transition and reduced motion is instant", async ({ browser }) => {
  const motion = await browser.newContext();
  const animated = await motion.newPage();
  await animated.goto("/es/servicios");
  const details = animated.locator("details").first();
  const transition = await details.evaluate((el) => {
    const style = getComputedStyle(el, "::details-content");
    return { property: style.transitionProperty, duration: style.transitionDuration };
  });
  expect(transition.property).toContain("height");
  expect(transition.duration).not.toBe("0s");
  const samples = await details.evaluate(
    (el) =>
      new Promise<number[]>((resolve) => {
        const heights: number[] = [];
        const start = performance.now();
        el.querySelector("summary")?.click();
        const tick = () => {
          heights.push(parseFloat(getComputedStyle(el, "::details-content").height));
          if (performance.now() - start < 450) requestAnimationFrame(tick);
          else resolve(heights);
        };
        tick();
      }),
  );
  const final = samples.at(-1) ?? 0;
  expect(samples[0]).toBeLessThan(final / 2);
  expect(final).toBeGreaterThan(0);
  expect(samples.some((value) => value > 0 && value < final)).toBe(true);
  await motion.close();

  const still = await browser.newContext({ reducedMotion: "reduce" });
  const instant = await still.newPage();
  await instant.goto("/es/servicios");
  const item = instant.locator("details").first();
  const duration = await item.evaluate(
    (el) => getComputedStyle(el, "::details-content").transitionDuration,
  );
  expect(parseFloat(duration)).toBe(0);
  const first = await item.evaluate((el) => {
    el.querySelector("summary")?.click();
    return parseFloat(getComputedStyle(el, "::details-content").height);
  });
  expect(first).toBeGreaterThan(0);
  await still.close();
});

test("freelance page: h1 query, rates stay provisional, three steps and CTA", async ({ page }) => {
  await page.goto("/es/servicios/freelance");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Programador freelance por horas",
  );
  await expect(page.getByRole("heading", { level: 2 }).nth(1)).toContainText(
    "Desarrollador React Native freelance",
  );
  const rates = page.locator("figure[data-status='provisional']");
  await expect(rates).toBeVisible();
  await expect(rates).toContainText("00");
  await expect(rates).toContainText("000");
  await expect(rates.locator("[data-provisional]")).toHaveCount(2);
  const steps = page.locator("#como-empezamos ol > li");
  await expect(steps).toHaveCount(3);
  await expect(page.locator("#contacto").getByRole("link").first()).toHaveAttribute(
    "href",
    "/es/contacto?via=freelance#formulario",
  );
  await expect(page.locator("#contacto").getByRole("link").nth(1)).toHaveAttribute(
    "href",
    "/es/servicios#como-trabajo",
  );
});

test("packs page: comparator, provisional prices and per-pack contact links", async ({ page }) => {
  await page.goto("/es/servicios/packs");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Precio de app móvil");
  const comparator = page.locator("#comparador");
  await expect(comparator.getByRole("heading", { level: 2 })).toContainText("Presupuesto de app");
  const packs = comparator.locator("[data-pack]");
  await expect(packs).toHaveCount(3);
  await expect(packs.locator("[data-provisional]")).toHaveCount(3);
  await expect(packs.first()).toHaveAttribute("data-status", "provisional");
  for (const slug of ["app-movil", "web-negocio", "web-y-app"]) {
    await expect(comparator.locator(`[data-pack='${slug}'] a`)).toHaveAttribute(
      "href",
      `/es/contacto?via=pack&pack=${slug}#formulario`,
    );
  }
  await expect(page.locator("#contacto").getByRole("link").first()).toHaveAttribute(
    "href",
    "/es/contacto?via=pack#formulario",
  );
});

test("a pack link lands on the form with the pack way preselected", async ({ page }) => {
  await page.goto("/es/servicios/packs");
  await page.locator("[data-pack='web-negocio'] a").click();
  await expect(page).toHaveURL(/\/es\/contacto\?via=pack&pack=web-negocio#formulario$/);
  await expect(page.locator("#formulario")).toBeVisible();
});

test("the contact form still accepts the old via values", async ({ page }) => {
  for (const via of ["packs", "contratacion"]) {
    const response = await page.goto(`/es/contacto?via=${via}`);
    expect(response?.status()).toBe(200);
  }
});

test("child pages mark their own tab as the current page", async ({ page }) => {
  for (const id of ["freelance", "packs"] as const) {
    await page.goto(`/es/servicios/${id}`);
    const nav = page.getByRole("navigation", { name: wayNav });
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
    await expect(nav.getByRole("link", { name: ways[id].nav })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("child page nav moves between pages", async ({ page }) => {
  await page.goto("/es/servicios/freelance");
  const nav = page.getByRole("navigation", { name: wayNav });
  await nav.getByRole("link", { name: ways.packs.nav }).click();
  await expect(page).toHaveURL(/\/es\/servicios\/packs$/);
  await nav.getByRole("link", { name: ways.contratacion.nav }).click();
  await expect(page).toHaveURL(/\/es\/servicios#contratacion$/);
});

test("breadcrumb collapses to the parent on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/es/servicios/packs");
  const crumbs = page.getByRole("navigation", { name: es.breadcrumbs.label });
  await expect(crumbs.getByRole("link", { name: "Servicios" })).toBeVisible();
  await expect(crumbs.getByRole("link", { name: "Inicio" })).toBeHidden();
});

for (const entry of pages) {
  test(`${entry.name} has no horizontal scroll at 360`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(entry.path);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);
  });
}
