import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, type Tag, withTag } from "./support/staff";

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

const p = (name: string) => msg(`admin.payouts.${name}`);

const list = "/es/admin/liquidaciones";
const freelanceId = "00000000-0000-4000-8000-0000000000f2";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.96" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function asAdmin(page: Page, target = list) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page.getByRole("heading", { level: 1, name: p("title") })).toBeVisible();
}

test("the builder groups the freelance apart and previews only approved entries", async ({
  page,
}) => {
  await asAdmin(page);
  await page.getByRole("button", { name: p("builder.open") }).click();
  const dialog = page.getByRole("dialog", { name: p("builder.title") });
  const select = dialog.getByLabel(p("builder.beneficiary"));
  await expect(select.locator("optgroup")).toHaveCount(2);
  await expect(
    select.locator(`optgroup[label="${p("builder.roles.freelance")}"] option`),
  ).toHaveText(["Fran Freelance"]);
  await select.selectOption({ label: "Fran Freelance" });
  await dialog.getByLabel(p("builder.start")).fill("2026-10-01");
  await dialog.getByLabel(p("builder.end")).fill("2026-10-31");
  await expect(dialog.getByText("2 líneas")).toBeVisible();
  await expect(dialog).toContainText("490,00");
  await expectClean(page);
});

test("a freelance payout is built, issued, paid and shows its entries", async ({ page }) => {
  await asAdmin(page);
  await page.getByRole("button", { name: p("builder.open") }).click();
  const dialog = page.getByRole("dialog", { name: p("builder.title") });
  await dialog.getByLabel(p("builder.beneficiary")).selectOption({ label: "Fran Freelance" });
  await dialog.getByLabel(p("builder.start")).fill("2026-10-01");
  await dialog.getByLabel(p("builder.end")).fill("2026-10-31");
  await expect(dialog.getByText("2 líneas")).toBeVisible();
  await dialog.getByRole("button", { name: p("builder.submit") }).click();
  await expect(dialog).toBeHidden();

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "Fran Freelance" }) });
  await expect(row).toContainText(p("list.kinds.freelance"));
  await expect(row).toContainText(p("statuses.draft"));
  await expect(row).toContainText("490,00");
  await row.getByRole("link", { name: p("list.open") }).click();

  await expect(page.getByRole("note")).toContainText(p("detail.items.notInvoice"));
  await expect(page.getByRole("heading", { name: p("detail.items.statementTitle") })).toBeVisible();
  await expect(page.getByRole("row", { name: /Catálogo de productos/ })).toContainText("8 h");
  await expect(page.getByRole("row", { name: /Maquetación de la portada/ })).toContainText(
    "210,00",
  );
  await expect(page.getByRole("row", { name: /Horas sin aprobar/ })).toHaveCount(0);
  await expectClean(page);

  await page.getByRole("button", { name: p("actions.issue") }).click();
  await expect(page.getByRole("status").filter({ hasText: p("actions.issueDone") })).toBeAttached();
  await page.getByRole("button", { name: p("actions.markPaid") }).click();
  const pay = page.getByRole("dialog", { name: p("pay.title") });
  await pay.getByLabel(p("pay.reference")).fill("TRF-FREELANCE-1");
  await pay.getByRole("button", { name: p("pay.submit") }).click();
  await expect(pay).toBeHidden();
  await expect(page.getByText("TRF-FREELANCE-1")).toBeVisible();
  await expect(page.getByRole("button", { name: p("actions.markPaid") })).toHaveCount(0);
});

test("a draft of the freelance can be deleted and its entries are free again", async ({ page }) => {
  await asAdmin(page);
  await page.getByRole("button", { name: p("builder.open") }).click();
  const dialog = page.getByRole("dialog", { name: p("builder.title") });
  await dialog.getByLabel(p("builder.beneficiary")).selectOption({ label: "Fran Freelance" });
  await dialog.getByLabel(p("builder.start")).fill("2026-10-01");
  await dialog.getByLabel(p("builder.end")).fill("2026-10-31");
  await expect(dialog.getByText("2 líneas")).toBeVisible();
  await dialog.getByRole("button", { name: p("builder.submit") }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("link", { name: /Abrir la liquidación de Fran Freelance/ }).click();
  await page.getByRole("button", { name: p("actions.deleteDraft") }).click();
  await page
    .getByRole("dialog", { name: p("deleteConfirm.title") })
    .getByRole("button", { name: p("deleteConfirm.submit") })
    .click();
  await expect(page).toHaveURL(/\/es\/admin\/liquidaciones$/);

  await page.getByRole("button", { name: p("builder.open") }).click();
  const again = page.getByRole("dialog", { name: p("builder.title") });
  await again.getByLabel(p("builder.beneficiary")).selectOption({ label: "Fran Freelance" });
  await again.getByLabel(p("builder.start")).fill("2026-10-01");
  await again.getByLabel(p("builder.end")).fill("2026-10-31");
  await expect(again.getByText("2 líneas")).toBeVisible();
});

test("the beneficiary in the address preselects the builder", async ({ page }) => {
  await asAdmin(page, `${list}?beneficiario=${freelanceId}`);
  const dialog = page.getByRole("dialog", { name: p("builder.title") });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel(p("builder.beneficiary"))).toHaveValue(freelanceId);
});

test("the overview counts the freelance entries waiting for approval", async ({
  page,
  request,
}) => {
  await signInAdmin(page, tag, `?next=${encodeURIComponent("/es/admin")}`);
  await expect(
    page.getByRole("heading", { level: 1, name: msg("admin.overview.title") }),
  ).toBeVisible();
  await request.post(`${mock}/__auth/overview-mode?tag=${tag.value}`, {
    data: { countersMode: "full" },
  });
  await page.reload();
  const cell = page
    .getByRole("listitem")
    .filter({ hasText: msg("admin.overview.cells.labels.fee_items_pending") });
  await expect(cell).toContainText("2");
  await expect(cell.getByRole("link")).toHaveAttribute("href", "/es/admin/proyectos");
});
