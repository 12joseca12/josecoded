import { expect, type Page, test } from "@playwright/test";

const pages = [
  "/es",
  "/es/servicios",
  "/es/servicios/freelance",
  "/es/servicios/a-medida",
  "/es/como-trabajo",
  "/es/sobre-mi",
  "/es/contacto",
  "/es/proyectos",
];

const promisedAndAbsent = ["/es/blog", "/es/chat"];

async function internalTargets(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""));
  const targets = hrefs
    .filter((href) => href.startsWith("/") && !href.startsWith("//"))
    .map((href) => href.split("#")[0]?.split("?")[0] ?? "")
    .filter((href) => href !== "");
  return [...new Set(targets)];
}

for (const path of pages) {
  test(`${path} links to nothing that answers 404`, async ({ page, request }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const targets = await internalTargets(page);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(promisedAndAbsent, `${path} links to ${target}`).not.toContain(target);
      const answer = await request.get(target);
      expect(answer.status(), `${path} links to ${target}`).toBeLessThan(400);
    }
  });
}

test("the header offers no chat button and no blog link", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("button", { name: "Chat", exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="/es/blog"]')).toHaveCount(0);
});

test("the menu leaves out the empty projects page", async ({ page }) => {
  await page.goto("/es");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("link").nth(1)).toHaveAttribute("href", "/es/servicios");
  await expect(nav.locator('a[href="/es/proyectos"]')).toHaveCount(0);
});

test("the projects page has crumbs, honest exits and noindex", async ({ page }) => {
  await page.goto("/es/proyectos");
  await expect(page.getByRole("navigation", { name: "Migas de pan" })).toBeVisible();
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: "Ver mi trayectoria" })).toHaveAttribute(
    "href",
    "/es/sobre-mi",
  );
  await expect(main.getByRole("link", { name: "Escribirme" })).toHaveAttribute(
    "href",
    "/es/contacto",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("llms.txt does not announce pages that are not there", async ({ request }) => {
  const body = await (await request.get("/llms.txt")).text();
  expect(body).not.toContain("/es/proyectos");
  expect(body).not.toContain("/es/blog");
});
