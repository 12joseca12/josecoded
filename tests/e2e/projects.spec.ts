import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

interface Node {
  "@type": string;
  [key: string]: unknown;
}

async function readNodes(page: Page): Promise<Node[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text) => (JSON.parse(text) as { "@graph": Node[] })["@graph"]);
}

const slugs = ["3catinfo", "3cat", "nextraket", "josecoded"];

test.describe("projects list", () => {
  test("shows the four cases with status and role and no placeholders", async ({ page }) => {
    await page.goto("/es/proyectos");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Apps y webs");
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(4);
    await expect(cards.first()).toContainText("En producción");
    await expect(cards.first()).toContainText("Mi papel");
    await expect(cards.last()).toContainText("En construcción");
    await expect(page.locator("main")).not.toContainText("{{DATO");
  });

  test("filters by kind with real links and keeps the canonical clean", async ({ page }) => {
    await page.goto("/es/proyectos");
    const tabs = page.getByRole("navigation", { name: "Filtrar por tipo" });
    await expect(tabs.getByRole("link", { name: "Todos" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "Apps" }).click();
    await expect(page).toHaveURL(/tipo=apps/);
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/es\/proyectos$/);
  });

  test("has no axe violations", async ({ page }) => {
    await page.goto("/es/proyectos");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("project page", () => {
  for (const slug of slugs) {
    test(`${slug} has the three sections, the need block and no axe violations`, async ({
      page,
    }) => {
      const response = await page.goto(`/es/proyectos/${slug}`);
      expect(response?.status()).toBe(200);
      const main = page.locator("main");
      await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(main.getByRole("heading", { level: 2, name: "El reto" })).toBeVisible();
      await expect(main.getByRole("heading", { level: 2, name: "Qué hice" })).toBeVisible();
      await expect(main.getByRole("heading", { level: 2, name: "El resultado" })).toBeVisible();
      await expect(main).not.toContainText("{{DATO");
      await expect(page.getByRole("complementary")).toContainText("¿Necesitas algo así?");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the need block goes to the service and to contact with via and from", async ({ page }) => {
    await page.goto("/es/proyectos/3catinfo");
    const need = page.getByRole("complementary");
    await expect(need.getByRole("link", { name: "Contármelo" })).toHaveAttribute(
      "href",
      "/es/contacto?via=freelance&from=3catinfo#formulario",
    );
    await expect(need.getByRole("link", { name: "Ver el servicio freelance" })).toHaveAttribute(
      "href",
      "/es/servicios/freelance",
    );
    await page.goto("/es/proyectos/nextraket");
    await expect(page.getByRole("link", { name: "Contármelo" })).toHaveAttribute(
      "href",
      "/es/contacto?via=project&from=nextraket#formulario",
    );
  });

  test("the contact form opens with the way picked by the project", async ({ page }) => {
    await page.goto("/es/proyectos/3catinfo");
    await page.getByRole("link", { name: "Contármelo" }).click();
    await expect(page).toHaveURL(/via=freelance&from=3catinfo/);
  });

  test("links the neighbours and the stack, and shows the sourced figure", async ({ page }) => {
    await page.goto("/es/proyectos/3cat");
    const nav = page.getByRole("navigation", { name: "Más proyectos" });
    await expect(nav.getByRole("link", { name: /3CatInfo/ })).toHaveAttribute(
      "href",
      "/es/proyectos/3catinfo",
    );
    await expect(nav.getByRole("link", { name: /NextRaket/ })).toHaveAttribute(
      "href",
      "/es/proyectos/nextraket",
    );
    await expect(page.getByRole("link", { name: "Ver todo mi stack" })).toHaveAttribute(
      "href",
      "/es/sobre-mi#stack",
    );
    await page.goto("/es/proyectos/josecoded");
    await expect(page.getByText("Dato verificable")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cómo trabajo" })).toHaveAttribute(
      "href",
      "/es/como-trabajo",
    );
  });

  test("describes a team app with a contributor and no rating", async ({ page }) => {
    await page.goto("/es/proyectos/3catinfo");
    const nodes = await readNodes(page);
    const types = nodes.map((node) => node["@type"]);
    expect(types).toContain("BreadcrumbList");
    const app = nodes.find((node) => node["@type"] === "MobileApplication");
    expect(app?.contributor).toBeDefined();
    expect(JSON.stringify(nodes)).not.toContain("aggregateRating");
  });

  test("answers 404 for a project that does not exist", async ({ page }) => {
    const response = await page.goto("/es/proyectos/no-existe");
    expect(response?.status()).toBe(404);
  });

  test("the sitemap lists every project page", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    for (const slug of slugs) expect(body).toContain(`/es/proyectos/${slug}`);
  });
});
