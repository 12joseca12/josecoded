import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import { staffNav } from "../../src/lib/staff/nav";
import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInClient, signInCloser, type Tag, withTag } from "./support/staff";

interface AreaMessages {
  area: { nav: Record<string, string>; empty: { title: string; text: string } };
  errors: { notFound: { title: string }; serverError: { title: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as AreaMessages;
const { area } = es;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.41" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__area/mode?tag=${tag.value}`, { data: mode });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("a client without a project sees the preparing state instead of a 404", async ({ page }) => {
  await signInClient(page, tag);
  await expect(page).toHaveURL(/\/es\/area$/);
  await expect(page.getByRole("heading", { level: 1, name: area.empty.title })).toBeVisible();
  await expect(page.getByText(area.empty.text)).toBeVisible();
  await expectClean(page);
});

test("the area nav lists the registry and only links the shipped screens", async ({ page }) => {
  await signInClient(page, tag);
  const nav = page.getByRole("navigation").first();
  const ready = staffNav.area.filter((entry) => entry.ready);
  for (const entry of ready) {
    await expect(nav.getByRole("link", { name: area.nav[entry.key] ?? "" })).toBeVisible();
  }
  await expect(page.locator("[data-zone='area']")).toBeVisible();
});

test("the active project comes from the URL, then the cookie, then the most recent", async ({
  page,
}) => {
  await setMode(page, { mode: "two" });
  await signInClient(page, tag);
  await expect(page.getByRole("heading", { level: 1, name: "Web de la panadería" })).toBeVisible();

  await page.goto("/es/area?proyecto=10000000-0000-4000-8000-000000000002");
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de cerámica" })).toBeVisible();

  await expect
    .poll(async () => (await page.context().cookies()).find((c) => c.name === "jc_project")?.value)
    .toBe("10000000-0000-4000-8000-000000000002");

  await page.goto("/es/area");
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de cerámica" })).toBeVisible();

  await page.goto("/es/area?proyecto=00000000-0000-4000-8000-00000000dead");
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de cerámica" })).toBeVisible();
});

test("a failing project query shows the error page with a retry", async ({ page }) => {
  await signInClient(page, tag);
  await setMode(page, { error: "projects" });
  await page.goto("/es/area");
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.serverError.title }),
  ).toBeVisible();
});

test("a closer gets the 404 page on the client area", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/area");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
});

test("the empty state has no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signInClient(page, tag);
  await expect(page.getByRole("heading", { level: 1, name: area.empty.title })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
