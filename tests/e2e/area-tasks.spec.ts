import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInClient, type Tag, withTag } from "./support/staff";

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

const tasks = (name: string) => msg(`area.tasks.${name}`);
const secondName = "Tienda de cerámica";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.43" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__area/mode?tag=${tag.value}`, { data: mode });
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }) {
  await setMode(page, mode);
  await signInClient(page, tag);
  await page.goto("/es/area/tareas");
  await expect(page.getByRole("heading", { level: 1, name: tasks("title") })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("the area nav links to the tasks screen", async ({ page }) => {
  await setMode(page, { mode: "one" });
  await signInClient(page, tag);
  await page
    .getByRole("navigation")
    .first()
    .getByRole("link", { name: msg("area.nav.tasks") })
    .click();
  await expect(page).toHaveURL(/\/es\/area\/tareas$/);
  await expect(page.getByRole("heading", { level: 1, name: tasks("title") })).toBeVisible();
});

test("the board groups the tasks by phase and marks the current one", async ({ page }) => {
  await open(page);
  const board = page.getByRole("group", { name: tasks("board") });
  for (const phase of ["discover", "design", "build", "publish", "maintain"]) {
    await expect(board.getByRole("heading", { name: msg(`area.phases.${phase}`) })).toBeVisible();
  }
  const build = board.getByRole("region", { name: msg("area.phases.build") });
  await expect(build.getByRole("link", { name: "Catálogo de productos" })).toBeVisible();
  await expect(build.getByText(tasks("status.doing"))).toBeVisible();
  const design = board.getByRole("region", { name: msg("area.phases.design") });
  await expect(design.getByText(tasks("mine"))).toBeVisible();
  await expect(design.getByText("De tu historia: Página de contacto")).toBeVisible();
  const maintain = board.getByRole("region", { name: msg("area.phases.maintain") });
  await expect(maintain.getByText(tasks("emptyPhase"))).toBeVisible();
});

test("a task opens its detail and a task of mine can be completed", async ({ page }) => {
  await open(page);
  await page.getByRole("link", { name: "Aprobar la maqueta de la portada" }).click();
  await expect(page).toHaveURL(/\/es\/area\/tareas\/[0-9a-f-]{36}/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Aprobar la maqueta de la portada" }),
  ).toBeVisible();
  await expect(page.getByText("Revisa la maqueta y dime si te encaja.")).toBeVisible();
  await expect(page.getByText(tasks("detail.assignedToYou"))).toBeVisible();
  await expect(page.getByText("De tu historia: Página de contacto")).toBeVisible();
  await expectClean(page);

  await page.getByRole("button", { name: tasks("detail.complete") }).click();
  await expect(page.getByRole("button", { name: tasks("detail.complete") })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: tasks("detail.done") })).toBeVisible();

  await page.getByRole("link", { name: tasks("detail.back") }).click();
  const row = page.getByRole("listitem").filter({ hasText: "Aprobar la maqueta de la portada" });
  await expect(row.getByText(tasks("status.done"))).toBeVisible();
});

test("a task that is not mine has no complete button", async ({ page }) => {
  await open(page);
  await page.getByRole("link", { name: "Catálogo de productos" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Catálogo de productos" }),
  ).toBeVisible();
  await expect(page.getByText(tasks("detail.noDescription"))).toBeVisible();
  await expect(page.getByRole("button", { name: tasks("detail.complete") })).toHaveCount(0);
});

test("an unknown task or one of another project is a 404", async ({ page }) => {
  await setMode(page, { mode: "two" });
  await signInClient(page, tag);
  const notFoundTitle = msg("errors.notFound.title");
  for (const target of [
    "/es/area/tareas/21000000-0000-4000-8000-000000000099?proyecto=10000000-0000-4000-8000-000000000001",
    "/es/area/tareas/21000000-0000-4000-8000-000000000003?proyecto=10000000-0000-4000-8000-000000000002",
    "/es/area/tareas/not-an-id",
  ]) {
    await page.goto(target);
    await expect(page.getByRole("heading", { level: 1, name: notFoundTitle })).toBeVisible();
  }
});

test("a project without tasks shows the empty state", async ({ page }) => {
  await open(page, { mode: "two" });
  await page
    .getByRole("navigation", { name: msg("area.home.switcher.label") })
    .getByRole("link", { name: secondName })
    .click();
  await expect(page.getByRole("heading", { name: tasks("emptyTitle") })).toBeVisible();
});

test("a failing board shows an error with retry and keeps the heading", async ({ page }) => {
  await open(page, { mode: "one", error: "tasks" });
  await expect(page.getByRole("heading", { name: tasks("error.title") })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: tasks("title") })).toBeVisible();
});

test("the board passes axe at 1440 and 375 without horizontal scroll", async ({ page }) => {
  await open(page);
  await expectClean(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.getByRole("heading", { level: 1, name: tasks("title") })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
