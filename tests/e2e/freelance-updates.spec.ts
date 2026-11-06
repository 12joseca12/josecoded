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

const updates = (name: string) => msg(`freelance.updates.${name}`);
const form = (name: string) => updates(`form.${name}`);
const shopId = "70000000-0000-4000-8000-000000000001";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.44" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: mode });
}

async function open(page: Page, mode: Record<string, unknown> = {}) {
  await setMode(page, { mode: "one", ...mode });
  await signInFreelance(page, tag);
  await page.goto(`/es/freelance/proyectos/${shopId}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
}

function log(page: Page) {
  return page.getByRole("list", { name: updates("list") });
}

function entry(page: Page, text: string) {
  return log(page).getByRole("listitem").filter({ hasText: text });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function calls(page: Page) {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as { freelanceRpc: { name: string; args?: unknown }[] })
    .freelanceRpc;
}

async function write(page: Page, text: string, publish: boolean) {
  await page.getByRole("button", { name: form("open") }).click();
  const dialog = page.getByRole("dialog", { name: form("title") });
  await dialog.getByLabel(form("body")).fill(text);
  if (publish) await dialog.getByLabel(form("visible")).check();
  await dialog.getByRole("button", { name: form("submit"), exact: true }).click();
  return dialog;
}

test("the log shows my update and Jose's with who wrote them and who sees them", async ({
  page,
}) => {
  await open(page);
  const mine = entry(page, "Portada maquetada en móvil.");
  await expect(mine).toContainText(updates("authors.me"));
  await expect(mine).toContainText("Maquetar la portada");
  await expect(mine.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  const jose = entry(page, "Mañana revisamos el catálogo.");
  await expect(jose).toContainText(updates("authors.jose"));
  await expect(jose.getByRole("switch")).toHaveCount(0);
  await expect(jose).toContainText(updates("visibility.client"));
  await expect(jose.getByRole("button", { name: /Borrar/ })).toHaveCount(0);
  await expectClean(page);
});

test("an update is internal by default and the client checkbox publishes it", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: form("open") }).click();
  const dialog = page.getByRole("dialog", { name: form("title") });
  await expect(dialog.getByLabel(form("visible"))).not.toBeChecked();
  await expect(dialog.getByText(form("visibleHint"))).toBeVisible();
  await expectClean(page);
  await dialog.getByLabel(form("body")).fill("Catálogo listo para revisar.");
  await dialog.getByRole("button", { name: form("submit"), exact: true }).click();
  await expect(dialog).toBeHidden();
  const added = entry(page, "Catálogo listo para revisar.");
  await expect(added).toBeVisible();
  await expect(added.getByRole("switch")).toHaveAttribute("aria-checked", "false");

  await write(page, "Esto sí lo ve el cliente.", true);
  const shared = entry(page, "Esto sí lo ve el cliente.");
  await expect(shared.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  const inserts = (await calls(page)).filter((call) => call.name === "project_updates.insert");
  expect(inserts.map((call) => (call.args as { visibility: string }).visibility)).toEqual([
    "internal",
    "client",
  ]);
});

test("the chip on my update switches the visibility", async ({ page }) => {
  await open(page);
  const mine = entry(page, "Portada maquetada en móvil.");
  await mine.getByRole("switch").click();
  await expect(mine.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await mine.getByRole("switch").click();
  await expect(mine.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  const names = (await calls(page)).map((call) => call.name);
  expect(names.filter((name) => name === "set_update_visibility")).toHaveLength(2);
});

test("deleting my update asks for confirmation", async ({ page }) => {
  await open(page);
  const mine = entry(page, "Portada maquetada en móvil.");
  await mine.getByRole("button", { name: /Borrar el avance/ }).click();
  await mine.getByRole("button", { name: updates("cancel") }).click();
  await expect(mine.getByText(updates("deleteConfirm"))).toHaveCount(0);
  await mine.getByRole("button", { name: /Borrar el avance/ }).click();
  await mine.getByRole("button", { name: updates("delete"), exact: true }).click();
  await expect(entry(page, "Portada maquetada en móvil.")).toHaveCount(0);
  await expect(entry(page, "Mañana revisamos el catálogo.")).toBeVisible();
});

test("an empty body is refused and a refusal from the server shows in the form", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: form("open") }).click();
  const dialog = page.getByRole("dialog", { name: form("title") });
  await dialog.getByRole("button", { name: form("submit"), exact: true }).click();
  await expect(dialog.getByText(form("errors.body"))).toBeVisible();
  await setMode(page, { updateError: "not_project_team" });
  await dialog.getByLabel(form("body")).fill("No debería guardarse");
  await dialog.getByRole("button", { name: form("submit"), exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(form("errors.not_project_team"));
});

test("without updates the log invites to write the first one", async ({ page }) => {
  await open(page, { updatesEmpty: true });
  await expect(page.getByText(updates("empty"))).toBeVisible();
  await expect(page.getByRole("button", { name: form("open") })).toBeVisible();
});

test("a failing updates query shows the retry state and keeps the rest", async ({ page }) => {
  await open(page, { error: "updates" });
  await expect(
    page.getByRole("button", { name: msg("freelance.project.error.retry") }),
  ).toBeVisible();
  await expect(page.getByText("Notas del equipo.txt")).toBeVisible();
});

test("the home lists the latest updates with who wrote them", async ({ page }) => {
  await setMode(page, { mode: "one" });
  await signInFreelance(page, tag);
  await page.goto("/es/freelance");
  const recent = page.getByRole("region", { name: msg("freelance.home.recent.title") });
  await expect(recent.getByText("Mañana revisamos el catálogo.")).toBeVisible();
  await expect(recent.getByText("Portada maquetada en móvil.")).toBeVisible();
  await expectClean(page);
});
