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

const stories = (name: string) => msg(`area.stories.${name}`);
const form = (name: string) => stories(`form.${name}`);
const detail = (name: string) => stories(`detail.${name}`);
const reviewStory = "Área de pedidos";
const proposedStory = "Buscador de productos";
const taskStory = "Página de contacto";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.44" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__area/mode?tag=${tag.value}`, { data: mode });
}

async function calls(page: Page) {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const body = (await response.json()) as { areaRpc: { name: string; args: unknown }[] };
  return body.areaRpc;
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }, path = "") {
  await setMode(page, mode);
  await signInClient(page, tag);
  await page.goto(`/es/area/historias${path}`);
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function openStory(page: Page, title: string) {
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

test("the list shows every story with its status", async ({ page }) => {
  await open(page);
  const list = page.getByRole("list", { name: stories("list") });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  const review = list.getByRole("listitem").filter({ hasText: reviewStory });
  await expect(review.getByText(stories("status.in_review"))).toBeVisible();
  await expect(review.getByText(/12 h/)).toBeVisible();
  await expect(
    list
      .getByRole("listitem")
      .filter({ hasText: proposedStory })
      .getByText(stories("status.proposed")),
  ).toBeVisible();
  await expectClean(page);
});

test("the nav leads to the stories screen", async ({ page }) => {
  await setMode(page, { mode: "one" });
  await signInClient(page, tag);
  await page
    .getByRole("navigation")
    .first()
    .getByRole("link", { name: msg("area.nav.stories") })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: stories("title") })).toBeVisible();
});

test("an empty project shows the example and invites to propose the first story", async ({
  page,
}) => {
  await open(page, { mode: "one", stories: [] });
  await expect(page.getByRole("heading", { name: stories("empty.title") })).toBeVisible();
  await expect(page.getByText(stories("empty.exampleTitle"))).toBeVisible();
  await expectClean(page);
  await page.getByRole("link", { name: stories("empty.cta") }).click();
  await expect(page.getByRole("heading", { level: 1, name: stories("meta.new") })).toBeVisible();
});

test("a story is proposed with criteria added and removed from the keyboard", async ({ page }) => {
  await open(page, { mode: "one" }, "?nueva=1");
  await expect(page.getByRole("heading", { level: 1, name: stories("meta.new") })).toBeVisible();

  await page.getByRole("button", { name: form("submit") }).click();
  await expect(page.getByText(form("errors.title"))).toBeVisible();
  await expect(page.getByLabel(form("title"))).toBeFocused();

  await page.getByLabel(form("title")).fill("Ver mis pedidos");
  await page.getByLabel(form("asA"), { exact: true }).fill("clienta");
  await page.getByLabel(form("iWant")).fill("ver mis pedidos anteriores");
  await page.getByLabel(form("soThat")).fill("repetir una compra");

  const add = page.getByRole("button", { name: form("addCriterion") });
  await add.click();
  await expect(page.getByLabel("Criterio 1")).toBeFocused();
  await page.keyboard.type("Lista de pedidos");
  await add.click();
  await expect(page.getByLabel("Criterio 2")).toBeFocused();
  await page.keyboard.type("Se puede repetir uno");
  await page.getByRole("button", { name: "Quitar el criterio 1" }).click();
  await expect(page.getByLabel("Criterio 1")).toHaveValue("Se puede repetir uno");
  await expect(page.getByLabel("Criterio 2")).toHaveCount(0);
  await expectClean(page);

  await page.getByRole("button", { name: form("submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: stories("sent") })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver mis pedidos" })).toBeVisible();
  const insert = (await calls(page)).find((call) => call.name === "stories.insert");
  expect(insert?.args).toMatchObject({
    title: "Ver mis pedidos",
    as_a: "clienta",
    criteria: ["Se puede repetir uno"],
  });
});

test("criteria stop at twelve", async ({ page }) => {
  await open(page, { mode: "one" }, "?nueva=1");
  const add = page.getByRole("button", { name: form("addCriterion") });
  for (let index = 0; index < 12; index += 1) await add.click();
  await expect(page.getByLabel(/^Criterio \d+$/)).toHaveCount(12);
  await expect(add).toBeDisabled();
});

test("a refused save explains itself and keeps the form", async ({ page }) => {
  await open(page, { mode: "one", storyError: "forbidden" }, "?nueva=1");
  await page.getByLabel(form("title")).fill("Algo");
  await page.getByLabel(form("asA"), { exact: true }).fill("yo");
  await page.getByLabel(form("iWant")).fill("esto");
  await page.getByLabel(form("soThat")).fill("aquello");
  await page.getByRole("button", { name: form("submit") }).click();
  await expect(page.getByRole("alert").filter({ hasText: form("errors.forbidden") })).toBeVisible();
  await expect(page.getByLabel(form("title"))).toHaveValue("Algo");
});

test("a proposed story can be edited", async ({ page }) => {
  await open(page);
  await openStory(page, proposedStory);
  await expect(page.getByText(detail("pendingHint"))).toBeVisible();
  await expectClean(page);
  await page.getByRole("link", { name: detail("edit") }).click();
  await expect(page.getByRole("heading", { level: 1, name: stories("meta.edit") })).toBeVisible();
  await expect(page.getByLabel(form("title"))).toHaveValue(proposedStory);
  await expect(page.getByLabel("Criterio 2")).toHaveValue("Es fácil de entender");
  await page.getByLabel(form("title")).fill("Buscador mejorado");
  await page.getByRole("button", { name: form("save") }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Buscador mejorado" })).toBeVisible();
});

test("a proposed story is deleted after confirming", async ({ page }) => {
  await open(page);
  await openStory(page, proposedStory);
  await page.getByRole("button", { name: detail("remove") }).click();
  await page.getByRole("button", { name: detail("removeNo") }).click();
  await expect(page.getByRole("button", { name: detail("remove") })).toBeVisible();
  await page.getByRole("button", { name: detail("remove") }).click();
  await page.getByRole("button", { name: detail("removeYes") }).click();
  await expect(page.getByRole("heading", { level: 1, name: stories("title") })).toBeVisible();
  await expect(page.getByRole("link", { name: proposedStory })).toHaveCount(0);
});

test("an out-of-budget story shows the verdict and is confirmed by the client", async ({
  page,
}) => {
  await open(page);
  await openStory(page, reviewStory);
  await expect(page.getByText(detail("reviewHint"))).toBeVisible();
  await expect(page.getByText(/Horas estimadas: 12 h/)).toBeVisible();
  await expect(page.getByText(/Importe orientativo: 480 €/)).toBeVisible();
  await expect(page.getByText("Queda fuera del alcance acordado.")).toBeVisible();
  await expect(page.getByRole("link", { name: detail("edit") })).toHaveCount(0);
  await expectClean(page);
  await page.getByRole("button", { name: detail("confirm") }).click();
  await expect(page.getByRole("status").filter({ hasText: detail("doneConfirm") })).toBeVisible();
  expect((await calls(page)).map((call) => call.name)).toEqual(["confirm_story"]);
});

test("a story turned into a task links to it", async ({ page }) => {
  await open(page);
  await openStory(page, taskStory);
  await expect(page.getByText(stories("status.in_tasks"))).toBeVisible();
  await page.getByRole("link", { name: detail("task") }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Aprobar la maqueta de la portada" }),
  ).toBeVisible();
});

test("an unknown story is a 404 and a failing list has its own error", async ({ page }) => {
  await open(page, { mode: "one" }, "/22000000-0000-4000-8000-000000000099");
  await expect(
    page.getByRole("heading", { level: 1, name: msg("errors.notFound.title") }),
  ).toBeVisible();
  await setMode(page, { error: "stories" });
  await page.goto("/es/area/historias");
  await expect(page.getByRole("heading", { name: stories("error.title") })).toBeVisible();
});

test("the form and the list fit at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, { mode: "one" }, "?nueva=1");
  await page.getByRole("button", { name: form("addCriterion") }).click();
  await expect(page.getByLabel("Criterio 1")).toBeVisible();
  await expectClean(page);
  let overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.goto("/es/area/historias");
  await expect(page.getByRole("heading", { level: 1, name: stories("title") })).toBeVisible();
  overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
