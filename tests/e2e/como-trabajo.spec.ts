import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

interface Messages {
  howPage: {
    head: { title: string; accent: string };
    meta: { title: string };
    crumb: string;
    phases: {
      title: string;
      list: string;
      items: {
        discover: { gets1: string; needs: string };
        publish: { gets1: string; needs: string };
      };
    };
    problems: { title: string; items: Record<string, { title: string }> };
    tech: { title: string; diagram: { label: string; description: string } };
    quality: { title: string };
    faq: { title: string };
    cta: { title: string };
  };
  services: { how: { more: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const how = es.howPage;
const shots = "/tmp/claude-0/-home-user/d354c808-0499-5ef6-99b4-dc711550feda/scratchpad";
const path = "/es/como-trabajo";
const phaseNames = ["Descubrir", "Diseñar", "Construir", "Publicar", "Mantener"];

test("has one h1, the section headings and a canonical", async ({ page }) => {
  await page.goto(path);
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText(how.head.title);
  await expect(h1).toContainText(how.head.accent);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    how.phases.title,
    how.problems.title,
    how.tech.title,
    how.quality.title,
    how.faq.title,
    how.cta.title,
  ]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://josecoded.com${path}`,
  );
  const title = await page.title();
  expect(title).toContain(how.meta.title);
  expect(title.length).toBeLessThanOrEqual(60);
});

test("breadcrumbs JSON-LD carries the nonce and lists the page", async ({ page }) => {
  await page.goto(path);
  const script = page.locator('script[type="application/ld+json"]');
  await expect(script).toHaveCount(2);
  const nonces = await script.evaluateAll((nodes) => nodes.map((node) => node.nonce));
  expect(nonces.every((nonce) => nonce.length > 0)).toBe(true);
  const graphs = await script.evaluateAll((nodes) =>
    nodes.map((node) => JSON.parse(node.textContent) as { "@graph"?: { "@type": string }[] }),
  );
  const types = graphs.flatMap((graph) => graph["@graph"]?.map((node) => node["@type"]) ?? []);
  expect(types).toContain("BreadcrumbList");
  expect(types).toContain("FAQPage");
});

test("the timeline shows the five phases and switches by click", async ({ page }) => {
  await page.goto(path);
  const list = page.getByRole("tablist", { name: how.phases.list });
  await expect(list).toBeVisible();
  await expect(page.getByRole("tab")).toHaveText(
    phaseNames.map((name, index) => `${index + 1}${name}`),
  );
  const first = page.getByRole("tab", { name: /Descubrir/ });
  await expect(first).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(page.getByRole("tabpanel")).toContainText(how.phases.items.discover.gets1);
  await page.getByRole("tab", { name: /Publicar/ }).click();
  await expect(page.getByRole("tab", { name: /Publicar/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tabpanel")).toContainText(how.phases.items.publish.needs);
  await expect(first).toHaveAttribute("aria-selected", "false");
});

test("the timeline is operable from the keyboard", async ({ page }) => {
  await page.goto(path);
  const first = page.getByRole("tab", { name: /Descubrir/ });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  const second = page.getByRole("tab", { name: /Diseñar/ });
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /Mantener/ })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /Mantener/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  const inactive = await page
    .getByRole("tab")
    .evaluateAll((nodes) => nodes.filter((node) => node.getAttribute("tabindex") === "-1").length);
  expect(inactive).toBe(4);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel")).toBeFocused();
});

test("three problem cards read problem, decision and result", async ({ page }) => {
  await page.goto(path);
  const cards = page.locator("#problemas article");
  await expect(cards).toHaveCount(3);
  await expect(cards.locator("h3")).toHaveText(
    Object.values(how.problems.items).map((item) => item.title),
  );
  await expect(cards.first().locator("dt")).toHaveText(["Problema", "Decisión", "Resultado"]);
});

test("the architecture diagram has an accessible name and a text alternative", async ({ page }) => {
  await page.goto(path);
  const figure = page.getByRole("figure", { name: how.tech.diagram.label });
  await expect(figure).toBeVisible();
  await expect(figure.locator("ol > li")).toHaveCount(3);
  await expect(figure.locator("svg")).toHaveCount(2);
  const decorative = await figure
    .locator("svg")
    .evaluateAll((nodes) => nodes.every((node) => node.getAttribute("aria-hidden") === "true"));
  expect(decorative).toBe(true);
  await expect(figure).toContainText(how.tech.diagram.description);
  await expect(figure).toContainText("Cloudflare Workers");
  await expect(figure).toContainText("Supabase");
});

test("the page links to contact, services and custom development", async ({ page }) => {
  await page.goto(path);
  const closing = page.locator("#contacto");
  await expect(closing.getByRole("link")).toHaveCount(3);
  await expect(closing.getByRole("link").nth(0)).toHaveAttribute("href", "/es/contacto#formulario");
  await expect(closing.getByRole("link").nth(1)).toHaveAttribute("href", "/es/servicios/a-medida");
  await expect(closing.getByRole("link").nth(2)).toHaveAttribute("href", "/es/servicios");
});

test("the services hub links to the page", async ({ page }) => {
  await page.goto("/es/servicios");
  await expect(
    page.locator("#como-trabajo").getByRole("link", { name: es.services.how.more }),
  ).toHaveAttribute("href", path);
  await page.goto("/es/servicios/freelance");
  await expect(page.locator("#contacto").getByRole("link").nth(1)).toHaveAttribute("href", path);
});

test("llms.txt and the sitemap list the page", async ({ request }) => {
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain(path);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`<loc>http://localhost:3000${path}</loc>`);
});

test("reduced motion removes the panel animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  const duration = await page
    .getByRole("tabpanel")
    .evaluate((node) => getComputedStyle(node).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.001);
});

for (const width of [1440, 375]) {
  test(`has no axe violations and no horizontal overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const scan = async () => {
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    };
    await scan();
    await page.getByRole("tab", { name: /Construir/ }).click();
    await scan();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const tabBoxes = await page.getByRole("tab").evaluateAll((nodes) =>
      nodes.map((node) => ({
        overflow: node.scrollWidth - node.clientWidth,
        height: node.getBoundingClientRect().height,
      })),
    );
    for (const box of tabBoxes) {
      expect(box.overflow).toBeLessThanOrEqual(0);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });

  test(`screenshots at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    for (const id of ["fases", "problemas", "tecnica", "calidad", "preguntas", "contacto"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.locator(`#${id}`).screenshot({ path: `${shots}/como-${id}-${width}.png` });
    }
    await page.screenshot({ path: `${shots}/como-top-${width}.png` });
  });
}
