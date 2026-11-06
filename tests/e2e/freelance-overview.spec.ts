import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInFreelance, type Tag, withTag } from "./support/staff";

interface Tree {
  [key: string]: string | Tree;
}

const messages = JSON.parse(readFileSync("messages/es.json", "utf8")) as Tree;

function msg(path: string): string {
  let node: string | Tree | undefined = messages;
  for (const part of path.split(".")) node = typeof node === "object" ? node[part] : undefined;
  if (typeof node !== "string") throw new Error(`Missing message ${path}`);
  return node;
}

const home = (name: string) => msg(`freelance.home.${name}`);

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.46" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function open(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: mode });
  await signInFreelance(page, tag);
  await expect(page.getByRole("heading", { level: 1, name: home("title") })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function cell(page: Page, label: string) {
  return page
    .getByRole("list", { name: home("counters.label") })
    .getByRole("listitem")
    .filter({ hasText: label });
}

test("the counters, the projects with their fee line, the todo and the feed show up", async ({
  page,
}) => {
  await open(page, { mode: "two" });
  await expect(cell(page, home("counters.projects"))).toContainText("2");
  await expect(cell(page, home("counters.tasks"))).toContainText("2");
  await expect(cell(page, home("counters.owed"))).toContainText(/280,00\s?€/);
  await expect(cell(page, home("counters.toDeliver"))).toContainText("1");

  const shop = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Tienda de Carla" }) });
  await expect(shop).toContainText(msg("freelance.fees.modes.hourly"));
  await expect(shop).toContainText(/35,00\s?€ la hora/);
  const landing = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Landing de la academia" }) });
  await expect(landing).toContainText(msg("freelance.fees.modes.milestones"));

  const todo = page.getByRole("region", { name: home("todo.title") });
  await expect(todo.getByRole("link", { name: "Maquetar la portada" })).toBeVisible();
  await expect(todo.getByRole("link", { name: "Preparar el catálogo" })).toBeVisible();
  await expect(todo.getByText("Diseño de la portada")).toBeVisible();

  const recent = page.getByRole("region", { name: msg("freelance.home.recent.title") });
  await expect(recent.getByText("Mañana revisamos el catálogo.")).toBeVisible();
  await expect(recent.getByText("Notas del equipo.txt")).toBeVisible();
  await expect(recent.getByText(/Maquetación de la portada \(Aprobado\)/)).toBeVisible();
  await expectClean(page);
});

test("a milestone is delivered from the home and leaves the todo", async ({ page }) => {
  await open(page, { mode: "two" });
  const todo = page.getByRole("region", { name: home("todo.title") });
  const row = todo.getByRole("listitem").filter({ hasText: "Diseño de la portada" });
  await row.getByRole("button", { name: home("todo.deliver") }).click();
  await expect(todo.getByText("Diseño de la portada")).toHaveCount(0);
  await expect(cell(page, home("counters.toDeliver"))).toContainText("0");
});

test("a failing counters call leaves dashes and keeps the project list", async ({ page }) => {
  await open(page, { mode: "two", counterError: true });
  await expect(
    cell(page, home("counters.owed")).getByText(home("counters.unknown")),
  ).toBeAttached();
  await expect(page.getByRole("heading", { level: 3, name: "Tienda de Carla" })).toBeVisible();
});

test("with no projects the home explains it and the todo is empty", async ({ page }) => {
  await open(page, { mode: "none" });
  await expect(page.getByRole("heading", { name: msg("freelance.empty.title") })).toBeVisible();
  await expect(page.getByText(home("todo.empty"))).toBeVisible();
  await expectClean(page);
});

test("the home has no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, { mode: "two" });
  await expect(cell(page, home("counters.owed"))).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
