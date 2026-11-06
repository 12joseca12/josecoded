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

const fees = (name: string) => msg(`freelance.fees.${name}`);
const pay = (name: string) => msg(`freelance.pay.${name}`);
const shopId = "70000000-0000-4000-8000-000000000001";
const landingId = "70000000-0000-4000-8000-000000000002";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.45" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: mode });
}

async function open(page: Page, path: string, mode: Record<string, unknown>) {
  await setMode(page, mode);
  await signInFreelance(page, tag);
  await page.goto(path);
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function item(page: Page, text: string) {
  return page.getByRole("listitem").filter({ hasText: text });
}

async function logHours(page: Page, hours: string, label: string, day?: string) {
  const form = page
    .getByRole("form")
    .or(page.locator("form"))
    .filter({ hasText: fees("form.title") });
  if (day) await form.getByLabel(fees("form.date")).fill(day);
  await form.getByLabel(fees("form.hours")).fill(hours);
  await form.getByLabel(fees("form.label")).fill(label);
  await form.getByRole("button", { name: fees("form.submit"), exact: true }).click();
  return form;
}

test("an hourly project shows the fee, the items and what is owed", async ({ page }) => {
  await open(page, `/es/freelance/proyectos/${shopId}`, { mode: "one" });
  await expect(page.getByRole("heading", { level: 2, name: fees("title") })).toBeVisible();
  await expect(page.getByText(fees("modes.hourly"), { exact: true })).toBeVisible();
  await expect(page.getByText(/Te deben\s+280,00\s?€/)).toBeVisible();
  await expect(item(page, "Maquetación de la portada")).toContainText(fees("statuses.approved"));
  await expect(item(page, "Catálogo, primera parte")).toContainText(fees("statuses.pending"));
  const rejected = item(page, "Horas duplicadas");
  await expect(rejected).toContainText(fees("statuses.rejected"));
  await expect(rejected).toContainText("Prueba: horas duplicadas");
  await expectClean(page);
});

test("logging hours adds a pending item, the cap and a future day fail in line", async ({
  page,
}) => {
  await open(page, `/es/freelance/proyectos/${shopId}`, { mode: "one" });
  await logHours(page, "3", "Ajustes de catálogo");
  const added = item(page, "Ajustes de catálogo");
  await expect(added).toBeVisible();
  await expect(added).toContainText(fees("statuses.pending"));
  await expect(added).toContainText(/105,00\s?€/);

  const form = await logHours(page, "20", "Demasiadas horas");
  await expect(form.getByText(fees("errors.hours_cap_exceeded"))).toBeVisible();
  const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  await form.getByLabel(fees("form.date")).evaluate((input: HTMLInputElement) => {
    input.removeAttribute("max");
  });
  await logHours(page, "1", "Mañana", future);
  await expect(form.getByText(fees("errors.future_date"))).toBeVisible();
  await expect(item(page, "Demasiadas horas")).toHaveCount(0);
});

test("a pending entry can be deleted and an empty form is refused", async ({ page }) => {
  await open(page, `/es/freelance/proyectos/${shopId}`, { mode: "one" });
  const form = await logHours(page, "", "");
  await expect(form.getByText(fees("errors.hours"))).toBeVisible();
  await item(page, "Catálogo, primera parte")
    .getByRole("button", { name: /Borrar el parte/ })
    .click();
  await expect(item(page, "Catálogo, primera parte")).toHaveCount(0);
});

test("a milestone is marked as delivered", async ({ page }) => {
  await open(page, `/es/freelance/proyectos/${landingId}`, { mode: "two" });
  const milestone = item(page, "Diseño de la portada");
  await expect(milestone).toContainText(fees("statuses.pending"));
  await expect(page.getByRole("form")).toHaveCount(0);
  await milestone.getByRole("button", { name: fees("deliver") }).click();
  await expect(milestone).toContainText(fees("statuses.delivered"));
  await expect(milestone.getByRole("button", { name: fees("deliver") })).toHaveCount(0);
});

test("payments show balances that match the items and the price of closed projects", async ({
  page,
}) => {
  await open(page, "/es/freelance/pagos", { mode: "history" });
  await expect(page.getByRole("heading", { level: 1, name: pay("title") })).toBeVisible();
  const balances = page.getByRole("list", { name: pay("balances.label") });
  await expect(
    balances.getByRole("listitem").filter({ hasText: pay("balances.owed") }),
  ).toContainText(/880,00\s?€/);
  await expect(
    balances.getByRole("listitem").filter({ hasText: pay("balances.pending") }),
  ).toContainText(/510,00\s?€/);

  const history = page.getByRole("group", { name: pay("history.region") });
  const closed = history.getByRole("row").filter({ hasText: "Prueba: landing cerrada" });
  await expect(closed).toContainText(fees("modes.fixed"));
  await expect(closed).toContainText(/900,00\s?€/);
  await expect(closed).toContainText(pay("history.closed"));
  await expect(history.getByRole("row").filter({ hasText: "Tienda de Carla" })).toContainText(
    pay("history.open"),
  );
  await expectClean(page);
});

test("the items filter by status and show the rejection reason", async ({ page }) => {
  await open(page, "/es/freelance/pagos", { mode: "history" });
  const tabs = page.getByRole("navigation", { name: pay("items.filters") });
  await tabs.getByRole("link", { name: new RegExp(fees("statuses.rejected")) }).click();
  const table = page.getByRole("group", { name: pay("items.region") });
  await expect(table.getByRole("row").filter({ hasText: "Horas duplicadas" })).toContainText(
    "Prueba: horas duplicadas",
  );
  await expect(table.getByRole("row").filter({ hasText: "Maquetación de la portada" })).toHaveCount(
    0,
  );
});

test("a payout opens its statement with the paid items and the withholding", async ({ page }) => {
  await open(page, "/es/freelance/pagos", { mode: "history" });
  await page.getByRole("link", { name: /Ver extracto de/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: pay("statement.title") })).toBeVisible();
  await expect(page.getByText(pay("statement.notInvoice"))).toBeVisible();
  await expect(page.getByText("Puesta a punto")).toBeVisible();
  await expect(page.getByText("TRF-2026-10")).toBeVisible();
  await expect(page.getByText(/297,50\s?€/)).toBeVisible();
  await expect(page.getByRole("button", { name: pay("statement.print") })).toBeVisible();
  await expectClean(page);

  const missing = await page.goto("/es/freelance/pagos/75000000-0000-4000-8000-0000000000ff");
  await expect(
    page.getByRole("heading", { level: 1, name: msg("errors.notFound.title") }),
  ).toBeVisible();
  expect(missing).not.toBeNull();
});

test("a failing counters call leaves the cells empty and the tables in place", async ({ page }) => {
  await open(page, "/es/freelance/pagos", { mode: "history", counterError: true });
  const balances = page.getByRole("list", { name: pay("balances.label") });
  await expect(balances.getByText(pay("balances.unknown")).first()).toBeAttached();
  await expect(
    page.getByRole("row").filter({ hasText: "Prueba: landing cerrada" }).first(),
  ).toBeVisible();
});

test("without fees the payments page explains it and a failing query shows retry", async ({
  page,
}) => {
  await open(page, "/es/freelance/pagos", { mode: "none" });
  await expect(page.getByRole("heading", { name: pay("empty.title") })).toBeVisible();
  await setMode(page, { mode: "one", error: "fees" });
  await page.goto("/es/freelance/pagos");
  await expect(page.getByRole("button", { name: pay("error.retry") }).first()).toBeVisible();
});
