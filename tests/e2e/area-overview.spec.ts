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

const home = (name: string) => msg(`area.home.${name}`);
const firstName = "Web de la panadería";
const secondName = "Tienda de cerámica";
const secondId = "10000000-0000-4000-8000-000000000002";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.42" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__area/mode?tag=${tag.value}`, { data: mode });
}

async function rpcCalls(page: Page) {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const calls = (await response.json()) as { areaRpc: { name: string }[] };
  return calls.areaRpc.map((call) => call.name);
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }) {
  await setMode(page, mode);
  await signInClient(page, tag);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("the overview shows the project, its phase, progress and what is on the client", async ({
  page,
}) => {
  await open(page);
  await expect(page.getByRole("heading", { level: 1, name: firstName })).toBeVisible();
  await expect(
    page.getByText(msg("offersPage.tiers.web-negocio.name"), { exact: true }),
  ).toBeVisible();

  const steps = page.getByRole("list", { name: home("steps.list") });
  await expect(steps.getByRole("listitem")).toHaveCount(5);
  await expect(steps.locator("[aria-current='step']")).toContainText(msg("area.phases.build"));

  const bar = page.getByRole("progressbar", { name: home("header.progress") });
  await expect(bar).toHaveAttribute("aria-valuenow", "40");

  const todo = page.getByRole("region", { name: home("todo.title") });
  await expect(todo.getByText("Aprobar la maqueta de la portada")).toBeVisible();
  await expect(todo.getByText("Conectar el dominio")).toBeVisible();
  await expect(todo.getByText("Catálogo de productos")).toHaveCount(0);
  await expect(todo.getByText("Área de pedidos")).toBeVisible();
  await expect(todo.getByText(/12 h/)).toBeVisible();

  const recent = page.getByRole("region", { name: home("recent.title") });
  await expect(recent.getByText("Presupuesto.pdf")).toBeVisible();
  await expect(recent.getByText("Notas internas.txt")).toHaveCount(0);
  await expect(recent.getByText(home("recent.story.in_review"))).toBeVisible();
});

test("the project links are external, safe and explain themselves", async ({ page }) => {
  await open(page);
  const links = page.getByRole("region", { name: home("links.title") });
  const first = links.getByRole("link", { name: /Versión de pruebas/ });
  await expect(first).toHaveAttribute("href", "https://staging.example.com/panaderia");
  await expect(first).toHaveAttribute("target", "_blank");
  await expect(first).toHaveAttribute("rel", /noopener/);
  await expect(first).toHaveAttribute("rel", /noreferrer/);
  await expect(first).toContainText(home("links.newTab"));
  await expect(links.getByText("staging.example.com")).toBeVisible();
  await expect(links.getByText("Aquí ves el avance antes de publicar.")).toBeVisible();
  await expect(links.getByRole("link")).toHaveCount(2);
});

test("the links block is hidden when Jose has not added any", async ({ page }) => {
  await open(page, { mode: "one", links: false });
  await expect(page.getByRole("region", { name: home("todo.title") })).toBeVisible();
  await expect(page.getByRole("heading", { name: home("links.title") })).toHaveCount(0);
});

test("marking a task as done updates the list and the progress", async ({ page }) => {
  await open(page);
  const todo = page.getByRole("region", { name: home("todo.title") });
  const row = todo.getByRole("listitem").filter({ hasText: "Conectar el dominio" });
  await row.getByRole("button", { name: home("todo.complete") }).click();
  await expect(todo.getByRole("status")).toHaveText(home("todo.done.task"));
  await expect(todo.getByText("Conectar el dominio")).toHaveCount(0);
  await expect(page.getByRole("progressbar", { name: home("header.progress") })).toHaveAttribute(
    "aria-valuenow",
    "60",
  );
  expect(await rpcCalls(page)).toEqual(["complete_my_task"]);
});

test("an out-of-budget story is confirmed from the overview", async ({ page }) => {
  await open(page);
  const todo = page.getByRole("region", { name: home("todo.title") });
  const card = todo.getByRole("listitem").filter({ hasText: "Área de pedidos" });
  await card.getByRole("button", { name: home("todo.confirm") }).click();
  await expect(todo.getByRole("status")).toHaveText(home("todo.done.confirm"));
  await expect(todo.getByText("Área de pedidos")).toHaveCount(0);
  expect(await rpcCalls(page)).toEqual(["confirm_story"]);
});

test("a story can be withdrawn instead of confirmed", async ({ page }) => {
  await open(page);
  const todo = page.getByRole("region", { name: home("todo.title") });
  const card = todo.getByRole("listitem").filter({ hasText: "Área de pedidos" });
  await card.getByRole("button", { name: home("todo.decline") }).click();
  await expect(todo.getByRole("status")).toHaveText(home("todo.done.decline"));
});

test("a refused action explains itself and keeps the item", async ({ page }) => {
  await open(page, { mode: "one", rpcError: "stale" });
  const todo = page.getByRole("region", { name: home("todo.title") });
  const row = todo.getByRole("listitem").filter({ hasText: "Conectar el dominio" });
  await row.getByRole("button", { name: home("todo.complete") }).click();
  await expect(todo.getByRole("status")).toHaveText(home("todo.errors.stale"));
});

test("two projects show the switcher and switching changes the page", async ({ page }) => {
  await open(page, { mode: "two" });
  const switcher = page.getByRole("navigation", { name: home("switcher.label") });
  await expect(switcher.getByRole("link")).toHaveCount(2);
  await expect(switcher.getByRole("link", { name: firstName })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await switcher.getByRole("link", { name: secondName }).click();
  await expect(page).toHaveURL(new RegExp(`proyecto=${secondId}`));
  await expect(page.getByRole("heading", { level: 1, name: secondName })).toBeVisible();
  await expect(page.getByRole("heading", { name: home("links.title") })).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: home("recent.title") }).getByText(home("recent.empty")),
  ).toBeVisible();
});

test("one project has no switcher", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("navigation", { name: home("switcher.label") })).toHaveCount(0);
});

test("a failing region shows its own error and leaves the rest of the page", async ({ page }) => {
  await open(page, { mode: "one", error: "links" });
  await expect(page.getByRole("heading", { level: 1, name: firstName })).toBeVisible();
  await expect(page.getByRole("heading", { name: home("error.title") })).toBeVisible();
  await expect(page.getByRole("region", { name: home("todo.title") })).toBeVisible();
});

test("the overview passes axe on desktop and mobile without horizontal scroll", async ({
  page,
}) => {
  await open(page);
  await expectClean(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.getByRole("heading", { level: 1, name: firstName })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
