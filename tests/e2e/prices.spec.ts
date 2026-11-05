import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface PricesMessages {
  admin: {
    prices: {
      title: string;
      tabs: Record<"offers" | "extras" | "rates" | "plans", string>;
      yes: string;
      no: string;
      archived: string;
      active: string;
      edit: string;
      moveUp: string;
      moveDown: string;
      archive: string;
      restore: string;
      confirmArchiveYes: string;
      history: string;
      sheet: {
        priceLabel: string;
        weeksMinLabel: string;
        weeksMaxLabel: string;
        visibleLabel: string;
        save: string;
        cancel: string;
      };
      actions: {
        done: { save: string; archive: string; restore: string; move: string };
        errors: { price: string; weeks: string; stale: string; forbidden: string };
      };
      error: { title: string; retry: string };
      empty: { title: string };
      region: string;
    };
  };
  services: { price: { review: string } };
}

const messages = JSON.parse(readFileSync("messages/es.json", "utf8")) as PricesMessages;
const es = messages.admin.prices;
const review = messages.services.price.review;

interface PriceCall {
  method: string;
  table: string;
  filters?: { key: string; updatedAt: string };
  patch?: Record<string, unknown>;
  level: string | null;
}

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.21" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function priceCalls(page: Page): Promise<PriceCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as { prices: PriceCall[] }).prices;
}

async function patches(page: Page): Promise<PriceCall[]> {
  return (await priceCalls(page)).filter((call) => call.method === "PATCH");
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function openPrices(page: Page, tab = "") {
  const target = `/es/admin/precios${tab}`;
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(new RegExp(`${target.replace("?", "\\?")}$`));
  await expect(page.getByRole("heading", { level: 1, name: es.title })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
}

function priceRow(page: Page, name: string): Locator {
  return page.getByRole("row").filter({ has: page.getByRole("rowheader", { name }) });
}

async function chooseTab(page: Page, label: string) {
  await page.getByRole("link", { name: label, exact: true }).click();
  await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

async function priceField(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog.getByLabel(es.sheet.priceLabel);
}

test("a closer gets a 404 on the prices screen", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/precios");
  expect(response?.status()).toBe(404);
});

test("the tiers tab lists the five tiers under review and passes axe at 1440 and 375", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPrices(page);
  await expect(page.getByRole("link", { name: es.tabs.offers, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const rows = page.getByRole("table").locator("tbody tr");
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText("Presencia");
  await expect(rows.first()).toContainText("2–3 semanas");
  await expect(rows.first()).toContainText(review);
  await expect(page.getByRole("region", { name: es.region })).toBeVisible();
  await expectClean(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(rows).toHaveCount(5);
  await expectClean(page);
  const calls = await priceCalls(page);
  expect(calls.filter((call) => call.method === "GET").every((call) => call.level === "aal2")).toBe(
    true,
  );
});

test("each tab shows its own rows", async ({ page }) => {
  await openPrices(page);
  await chooseTab(page, es.tabs.extras);
  await expect(page).toHaveURL(/tab=extras$/);
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(4);
  await expect(priceRow(page, "Idiomas")).toContainText("Por unidad");
  await chooseTab(page, es.tabs.rates);
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(2);
  await chooseTab(page, es.tabs.plans);
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(3);
  await expect(priceRow(page, "Plan S")).toContainText(review);
  await expectClean(page);
});

test("an admin sets a price and the weeks of a tier and sees it in the history", async ({
  page,
}) => {
  await openPrices(page);
  const row = priceRow(page, "Presencia");
  await row.getByRole("button", { name: `${es.edit}: Presencia` }).click();
  const price = await priceField(page);
  await expectClean(page);
  await price.fill("1200,50");
  await page.getByLabel(es.sheet.weeksMinLabel).fill("3");
  await page.getByLabel(es.sheet.weeksMaxLabel).fill("5");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: es.actions.done.save })).toBeVisible();
  await expect(row.locator("td").first()).toContainText("1200,5");
  await expect(row.locator("td").first()).not.toContainText(review);
  await expect(row).toContainText("3–5 semanas");
  const [call] = await patches(page);
  expect(call?.table).toBe("offers");
  expect(call?.filters?.key).toBe("web-presencia");
  expect(call?.patch).toEqual({ price: 1200.5, weeks_min: 3, weeks_max: 5 });
  await row.getByText(es.history, { exact: true }).click();
  await expect(row).toContainText(`${review} → 1200,5 €`);
  await expect(row).toContainText("Jose Enrolled");
});

test("a price can be cleared so the web shows it under review again", async ({ page }) => {
  await openPrices(page, "?tab=mantenimiento");
  const row = priceRow(page, "Plan M");
  await row.getByRole("button", { name: `${es.edit}: Plan M` }).click();
  await (await priceField(page)).fill("49");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(row.locator("td").first()).toContainText("49");
  await row.getByRole("button", { name: `${es.edit}: Plan M` }).click();
  await (await priceField(page)).fill("");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(row.locator("td").first()).toContainText(review);
  const sent = (await patches(page)).map((call) => call.patch);
  expect(sent).toEqual([
    { price_monthly: 49, visible: true },
    { price_monthly: null, visible: true },
  ]);
});

test("a bad price is explained and nothing is sent", async ({ page }) => {
  await openPrices(page);
  await priceRow(page, "Negocio")
    .getByRole("button", { name: `${es.edit}: Negocio` })
    .click();
  await (await priceField(page)).fill("mil");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(es.actions.errors.price);
  expect(await patches(page)).toHaveLength(0);
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.cancel }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    priceRow(page, "Negocio").getByRole("button", { name: `${es.edit}: Negocio` }),
  ).toBeFocused();
});

test("an inverted timeline and a forbidden write are reported", async ({ page, request }) => {
  await openPrices(page);
  const row = priceRow(page, "Negocio");
  await row.getByRole("button", { name: `${es.edit}: Negocio` }).click();
  await page.getByLabel(es.sheet.weeksMinLabel).fill("9");
  await page.getByLabel(es.sheet.weeksMaxLabel).fill("3");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(es.actions.errors.weeks);
  expect(await patches(page)).toHaveLength(0);

  await page.getByLabel(es.sheet.weeksMinLabel).fill("4");
  await page.getByLabel(es.sheet.weeksMaxLabel).fill("6");
  await request.post(`${mock}/__auth/prices-write-error?tag=${tag.value}`, {
    data: { error: { code: "42501", message: "permission denied" } },
  });
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(es.actions.errors.forbidden);
});

test("a row that changed meanwhile asks for a reload", async ({ page, request }) => {
  await openPrices(page);
  const row = priceRow(page, "Plataforma");
  await row.getByRole("button", { name: `${es.edit}: Plataforma` }).click();
  await request.post(`${mock}/__auth/prices-bump?tag=${tag.value}`, {
    data: { table: "offers", key: "web-plataforma" },
  });
  await (await priceField(page)).fill("3000");
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(es.actions.errors.stale);
});

test("extras can be hidden, reordered, archived and restored", async ({ page }) => {
  await openPrices(page, "?tab=extras");
  const names = page.getByRole("table").locator("tbody tr > th");
  await expect(names.first()).toContainText("Cuentas y permisos");
  await expect(
    priceRow(page, "Cuentas y permisos").getByRole("button", {
      name: `${es.moveUp}: Cuentas y permisos`,
    }),
  ).toBeDisabled();

  await priceRow(page, "Cuentas y permisos")
    .getByRole("button", { name: `${es.moveDown}: Cuentas y permisos` })
    .click();
  await expect(page.getByRole("status").filter({ hasText: es.actions.done.move })).toBeVisible();
  await expect(names.first()).toContainText("Panel de gestión");
  await expect(names.nth(1)).toContainText("Cuentas y permisos");

  const seo = priceRow(page, "Posicionamiento");
  await seo.getByRole("button", { name: `${es.edit}: Posicionamiento` }).click();
  await page.getByLabel(es.sheet.visibleLabel).uncheck();
  await page.getByRole("dialog").getByRole("button", { name: es.sheet.save }).click();
  await expect(seo).toContainText(es.no);

  await seo.getByRole("button", { name: `${es.archive}: Posicionamiento` }).click();
  await seo.getByRole("button", { name: es.confirmArchiveYes }).click();
  await expect(seo).toContainText(es.archived);
  await expect(page.getByRole("status").filter({ hasText: es.actions.done.archive })).toBeVisible();

  await seo.getByRole("button", { name: `${es.restore}: Posicionamiento` }).click();
  await expect(seo).toContainText(es.active);
  await expect(page.getByRole("status").filter({ hasText: es.actions.done.restore })).toBeVisible();
  await expectClean(page);
});

test("tiers and rates cannot be hidden, archived or reordered", async ({ page }) => {
  await openPrices(page);
  const row = priceRow(page, "Presencia");
  await expect(row.getByRole("button")).toHaveCount(1);
  await row.getByRole("button", { name: `${es.edit}: Presencia` }).click();
  await expect(page.getByLabel(es.sheet.visibleLabel)).toHaveCount(0);
});

test("the prices screen has empty and error states", async ({ page, request }) => {
  await openPrices(page);
  await request.post(`${mock}/__auth/prices-mode?tag=${tag.value}`, { data: { mode: "empty" } });
  await page.reload();
  await expect(page.getByRole("heading", { name: es.empty.title })).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/prices-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: es.error.title })).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/prices-mode?tag=${tag.value}`, { data: { mode: "data" } });
  await page.getByRole("button", { name: es.error.retry }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
