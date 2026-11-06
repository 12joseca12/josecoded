import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin, signInAdmin, type Tag, withTag } from "./support/staff";

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

const u = (name: string) => msg(`admin.projects.updates.${name}`);
const tabs = (name: string) => msg(`admin.projects.detail.tabs.${name}`);

const shop = "60000000-0000-4000-8000-000000000001";
const path = (tab: string) => `/es/admin/proyectos/${shop}?tab=${tab}`;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.95" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function open(page: Page, tab: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path(tab))}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function update(page: Page, text: string): Locator {
  return page.getByRole("article").filter({ hasText: text });
}

test("the tab counts the updates of the freelance that were not read, and reading clears it", async ({
  page,
}) => {
  await open(page, "tareas");
  const nav = page.getByRole("navigation", { name: msg("admin.projects.detail.tabsLabel") });
  await nav.getByRole("link", { name: tabs("updatesPending").replace("{count}", "2") }).click();
  await expect(update(page, "El catálogo ya carga")).toBeVisible();
  await nav.getByRole("link", { name: tabs("tasks") }).click();
  await expect(nav.getByRole("link", { name: tabs("updates"), exact: true })).toBeVisible();
});

test("the list shows author, task, date and visibility, and passes axe", async ({ page }) => {
  await open(page, "avances");
  await expect(page.getByRole("article")).toHaveCount(3);
  const shared = update(page, "El catálogo ya carga");
  await expect(shared).toContainText("Fran Freelance");
  await expect(shared).toContainText(u("task").replace("{title}", "Tarea 5"));
  await expect(shared).toContainText(u("visibility.client"));
  await expect(update(page, "Pendiente confirmar")).toContainText(u("visibility.internal"));
  await expect(update(page, "Esta semana cerramos")).toContainText("Jose");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
});

test("an internal update of the freelance is published to the client and hidden again", async ({
  page,
}) => {
  await open(page, "avances");
  const internal = update(page, "Pendiente confirmar");
  await internal.getByRole("button", { name: u("publish") }).click();
  await expect(internal).toContainText(u("visibility.client"));
  await expect(page.getByRole("status").filter({ hasText: u("published") })).toHaveCount(1);
  await internal.getByRole("button", { name: u("hide") }).click();
  await expect(internal).toContainText(u("visibility.internal"));
});

test("Jose writes a published update and an internal one", async ({ page }) => {
  await open(page, "avances");
  const form = page.getByRole("form", { name: u("form.title") });
  await form.getByRole("button", { name: u("form.submit") }).click();
  await expect(form.getByText(u("form.errors.body"))).toBeVisible();

  await form.getByLabel(u("form.body")).fill("Entregamos la portada el jueves.");
  await form.getByLabel(u("form.task"), { exact: false }).selectOption({ label: "Tarea 6" });
  await expect(form.getByLabel(u("form.visible"))).toBeChecked();
  await form.getByRole("button", { name: u("form.submit") }).click();
  const published = update(page, "Entregamos la portada");
  await expect(published).toContainText(u("visibility.client"));
  await expect(published).toContainText("Jose");

  await form.getByLabel(u("form.body")).fill("Nota para mí: revisar las imágenes.");
  await form.getByLabel(u("form.visible")).uncheck();
  await form.getByRole("button", { name: u("form.submit") }).click();
  await expect(update(page, "Nota para mí")).toContainText(u("visibility.internal"));
  await expect(page.getByRole("article")).toHaveCount(5);
});

test("an update is deleted after a confirmation", async ({ page }) => {
  await open(page, "avances");
  await page.getByRole("button", { name: u("deleteFor").replace("{author}", "Jose") }).click();
  const dialog = page.getByRole("dialog", { name: u("deleteTitle") });
  await expectNoViolations(page);
  await dialog.getByRole("button", { name: u("deleteSubmit") }).click();
  await expect(update(page, "Esta semana cerramos")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(2);
});
