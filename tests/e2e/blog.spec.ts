import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  meta: { titleTemplate: string };
  blog: {
    tabs: { label: string; all: string };
    pagination: { label: string; next: string; status: string };
    post: { toc: { label: string }; faq: { title: string }; print: string };
    categories: Record<string, { label: string }>;
  };
};

interface Node {
  "@type": string;
  [key: string]: unknown;
}

async function readNodes(page: Page): Promise<Node[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text) => (JSON.parse(text) as { "@graph": Node[] })["@graph"]);
}

const article = "/es/blog/cuanto-cuesta-una-app-movil-en-espana";
const accessibility = "/es/blog/accesibilidad-apps-european-accessibility-act";
const magnet = "/es/blog/antes-de-pedir-presupuesto-de-una-app";
const brandSuffix = es.meta.titleTemplate.replace("%s", "");

const routes = [
  "/es/blog",
  "/es/blog?pagina=2",
  "/es/blog/tema/accesibilidad-ia",
  article,
  accessibility,
  "/es/blog/programador-freelance-por-horas-o-por-tarea",
  "/es/blog/integrar-ia-en-una-app-de-noticias",
  magnet,
  "/es/blog/plantilla-de-auditoria-react-native",
];

for (const width of [1440, 390]) {
  for (const route of routes) {
    test(`${route} passes axe at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }
}

for (const route of routes) {
  test(`${route} has one h1, a title within the limit and a canonical`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const title = await page.title();
    expect(title.endsWith(brandSuffix)).toBe(true);
    expect(title.length).toBeLessThanOrEqual(60);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeGreaterThanOrEqual(50);
    expect(description?.length).toBeLessThanOrEqual(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://josecoded.com${route}`,
    );
  });
}

test("the index lists the first page of posts and paginates with ?pagina=", async ({ page }) => {
  await page.goto("/es/blog");
  const main = page.locator("main");
  await expect(main.getByRole("article")).toHaveCount(4);
  const pagination = main.getByRole("navigation", { name: es.blog.pagination.label });
  await expect(pagination).toContainText("Página 1 de 2");
  await pagination.getByRole("link", { name: es.blog.pagination.next }).click();
  await expect(page).toHaveURL(/\/es\/blog\?pagina=2$/);
  await expect(main.getByRole("article")).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://josecoded.com/es/blog?pagina=2",
  );
});

test("a page past the last one and a malformed page answer 404", async ({ request }) => {
  expect((await request.get("/es/blog?pagina=9")).status()).toBe(404);
  expect((await request.get("/es/blog?pagina=abc")).status()).toBe(404);
  expect((await request.get("/es/blog/tema/desarrollo-web")).status()).toBe(404);
  expect((await request.get("/es/blog/tema/ia")).status()).toBe(404);
  expect((await request.get("/es/blog/no-existe")).status()).toBe(404);
});

test("the tabs filter by topic and mark the current one", async ({ page }) => {
  await page.goto("/es/blog");
  const tabs = page.getByRole("navigation", { name: es.blog.tabs.label });
  await expect(tabs.getByRole("link", { name: es.blog.tabs.all })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    tabs.getByRole("link", { name: es.blog.categories["desarrollo-web"]?.label ?? "" }),
  ).toHaveCount(0);
  await tabs
    .getByRole("link", { name: es.blog.categories["accesibilidad-ia"]?.label ?? "" })
    .click();
  await expect(page).toHaveURL(/\/es\/blog\/tema\/accesibilidad-ia$/);
  await expect(page.locator("main").getByRole("article")).toHaveCount(2);
});

test("an article has author, dates, contents, related service twice, FAQ and two more reads", async ({
  page,
}) => {
  await page.goto(article);
  const main = page.locator("main");
  await expect(main.getByRole("region", { name: "Sobre el autor" })).toContainText(
    "José Carlos Sánchez García",
  );
  await expect(main.locator("time")).not.toHaveCount(0);
  await expect(main.getByRole("navigation", { name: es.blog.post.toc.label })).toBeVisible();
  await expect(main.locator("[data-related-service]")).toHaveCount(2);
  await expect(main.getByRole("heading", { name: es.blog.post.faq.title })).toBeVisible();
  await expect(main.locator("details")).toHaveCount(4);
  await expect(main.getByRole("article")).toHaveCount(2);
  await expect(main.getByRole("button", { name: es.blog.post.print })).toHaveCount(0);
});

test("the first related-service block sits in the first third of the article", async ({ page }) => {
  await page.goto(article);
  const prose = page.locator("main [data-related-service]");
  const first = await prose.first().boundingBox();
  const last = await prose.last().boundingBox();
  const end = await page.locator("main").boundingBox();
  if (!first || !last || !end) throw new Error("missing boxes");
  expect(first.y).toBeLessThan(last.y);
  expect((first.y - end.y) / end.height).toBeLessThan(0.45);
});

test("a printable resource offers the print button", async ({ page }) => {
  await page.goto(magnet);
  await expect(
    page.locator("main").getByRole("button", { name: es.blog.post.print }),
  ).toBeVisible();
});

test("an article publishes BlogPosting, FAQPage and BreadcrumbList", async ({ page }) => {
  await page.goto(article);
  const nodes = await readNodes(page);
  const types = nodes.map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["BlogPosting", "FAQPage", "BreadcrumbList"]));
  const posting = nodes.find((node) => node["@type"] === "BlogPosting");
  expect(posting?.url).toBe(`http://localhost:3000${article}`);
  expect(posting?.datePublished).toBe("2026-11-05");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
});

test("the index publishes Blog, ItemList and BreadcrumbList", async ({ page }) => {
  await page.goto("/es/blog");
  const types = (await readNodes(page)).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Blog", "ItemList", "BreadcrumbList"]));
});

test("the sitemap and llms.txt list the posts", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`<loc>http://localhost:3000${article}</loc>`);
  expect(sitemap).toContain("<loc>http://localhost:3000/es/blog/tema/precios</loc>");
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain(`http://localhost:3000${article}`);
});

test("the article layout does not scroll sideways at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(accessibility);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
