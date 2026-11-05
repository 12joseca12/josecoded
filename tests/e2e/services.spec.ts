import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  breadcrumbs: { label: string };
  services: {
    nav: { label: string };
    how: { title: string };
    faq: { title: string };
    bento: {
      title: string;
      expectationLabel: string;
      hiring: Record<"cv" | "trajectory" | "availability", string>;
    };
    team: { title: string; pr: string; ci: string; review: string; more: string };
    ways: Record<"contratacion" | "freelance" | "project" | "audit", { nav: string }>;
    audit: { title: string };
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
  { name: "hub", path: "/es/servicios", crumbs: ["Inicio", "Servicios"], faq: 7 },
  {
    name: "freelance",
    path: "/es/servicios/freelance",
    crumbs: ["Inicio", "Servicios", "Freelance"],
    faq: 6,
  },
  {
    name: "a-medida",
    path: "/es/servicios/a-medida",
    crumbs: ["Inicio", "Servicios", "A medida"],
    faq: 10,
  },
  {
    name: "auditoria",
    path: "/es/servicios/auditoria",
    crumbs: ["Inicio", "Servicios", "Auditoría"],
    faq: 7,
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
    es.services.audit.title,
    es.services.team.title,
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
  for (const path of ["/es/servicios/freelance", "/es/servicios/a-medida"]) {
    await page.goto(path);
    await expect(page.locator("#como-trabajo")).toHaveCount(0);
  }
});

test("hub tiles stay compact and show no price while it is under review", async ({ page }) => {
  await page.goto("/es/servicios");
  await expect(page.locator("#vias [data-variant='review']")).toHaveCount(0);
  await expect(page.locator("#vias")).not.toContainText(/\b0{2,3}\b/);
});

test("hub tiles link to their destinations with unified params", async ({ page }) => {
  await page.goto("/es/servicios");
  const hiring = page.locator("#contratacion");
  const cv = hiring.getByRole("link", { name: es.services.bento.hiring.cv });
  await expect(cv).toHaveAttribute("href", "/cv/cv-jose-carlos-sanchez-es.pdf");
  await expect(cv).toHaveAttribute("download", "");
  await expect(
    hiring.getByRole("link", { name: es.services.bento.hiring.trajectory }),
  ).toHaveAttribute("href", "/es/sobre-mi");
  await expect(
    hiring.getByRole("link", { name: es.services.bento.hiring.availability }),
  ).toHaveAttribute("href", "/es/contacto?via=hiring#formulario");
  await expect(page.locator("#freelance").getByRole("link")).toHaveAttribute(
    "href",
    "/es/servicios/freelance",
  );
  await expect(page.locator("#project").getByRole("link")).toHaveAttribute(
    "href",
    "/es/servicios/a-medida",
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
    expect(count).toBe(7);
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
    await page.locator("#project").evaluate((el) => {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 140 });
    });
    await page.locator("#project").click({ position: { x: 40, y: 40 } });
    await expect(page).toHaveURL(/\/es\/servicios\/a-medida$/);
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
    .locator("#contratacion, #project, #freelance")
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
    "Desarrollador React Native freelance, por horas o por tarea.",
  );
  await expect(page.getByRole("heading", { level: 2 }).nth(1)).toContainText(
    "Encargos típicos y su tamaño",
  );
  const rates = page.locator("figure[data-status='review']");
  await expect(rates).toBeVisible();
  await expect(rates.locator("[data-variant='review']")).toHaveCount(2);
  await expect(rates.locator("[data-variant='review']").first()).toHaveText("Precio en revisión");
  await expect(rates).not.toContainText("24–48 h");
  await expect(rates).not.toContainText(/\b0{2,3}\b/);
  await expect(rates).not.toContainText("€");
  const steps = page.locator("#como-empezamos ol > li");
  await expect(steps).toHaveCount(3);
  await expect(page.locator("#contacto").getByRole("link").first()).toHaveAttribute(
    "href",
    "/es/contacto?via=freelance#formulario",
  );
  await expect(page.locator("#contacto").getByRole("link").nth(1)).toHaveAttribute(
    "href",
    "/es/como-trabajo",
  );
});

test("the contact form still accepts the old via values", async ({ page }) => {
  for (const via of ["packs", "pack", "project", "contratacion"]) {
    const response = await page.goto(`/es/contacto?via=${via}`);
    expect(response?.status()).toBe(200);
  }
});

test("child pages mark their own tab as the current page", async ({ page }) => {
  for (const [id, path] of [
    ["freelance", "freelance"],
    ["project", "a-medida"],
    ["audit", "auditoria"],
  ] as const) {
    await page.goto(`/es/servicios/${path}`);
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
  await nav.getByRole("link", { name: ways.project.nav }).click();
  await expect(page).toHaveURL(/\/es\/servicios\/a-medida$/);
  await nav.getByRole("link", { name: ways.contratacion.nav }).click();
  await expect(page).toHaveURL(/\/es\/sobre-mi$/);
});

test("breadcrumb collapses to the parent on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/es/servicios/a-medida");
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

test("hub downloads the CV from the primary hiring action", async ({ page }) => {
  await page.goto("/es/servicios");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: es.services.bento.hiring.cv }).click();
  expect((await download).suggestedFilename()).toBe("cv-jose-carlos-sanchez-es.pdf");
});

test("every hub tile says what the visitor receives after getting in touch", async ({ page }) => {
  await page.goto("/es/servicios");
  for (const id of ["contratacion", "project", "freelance"]) {
    await expect(
      page.locator(`#${id}`).getByText(es.services.bento.expectationLabel),
    ).toBeVisible();
  }
});

test("hub lists the team practices the repository really follows with a link to Cómo trabajo", async ({
  page,
}) => {
  await page.goto("/es/servicios");
  const section = page.locator("#en-equipo");
  await expect(section.getByRole("list").getByRole("listitem")).toHaveText([
    es.services.team.pr,
    es.services.team.ci,
    es.services.team.review,
  ]);
  await section.getByRole("link", { name: es.services.team.more }).click();
  await expect(page).toHaveURL(/\/es\/como-trabajo$/);
});
