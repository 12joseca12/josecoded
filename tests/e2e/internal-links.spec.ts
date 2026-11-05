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
  "/es/proyectos/3catinfo",
  "/es/proyectos/josecoded",
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

test("the menu lists the projects page", async ({ page }) => {
  await page.goto("/es");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.locator('a[href="/es/proyectos"]')).toHaveCount(1);
});

test("the home offers the projects button", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("link", { name: "Ver proyectos" }).first()).toHaveAttribute(
    "href",
    "/es/proyectos",
  );
});

test("llms.txt lists the projects and not the blog", async ({ request }) => {
  const body = await (await request.get("/llms.txt")).text();
  expect(body).toContain("/es/proyectos/3catinfo");
  expect(body).not.toContain("/es/blog");
});
