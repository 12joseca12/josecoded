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

const f = (name: string) => msg(`admin.projects.team.fee.${name}`);
const sheet = (name: string) => f(`sheet.${name}`);
const add = (name: string) => f(`add.${name}`);
const table = (name: string) => f(`table.${name}`);
const errors = (name: string) => f(`errors.${name}`);

const shop = "60000000-0000-4000-8000-000000000001";
const landing = "60000000-0000-4000-8000-000000000002";
const path = (id: string) => `/es/admin/proyectos/${id}?tab=equipo`;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.97" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function openTeam(page: Page, id: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path(id))}`);
  await expect(page.getByRole("heading", { level: 2, name: f("title") })).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function row(page: Page, label: string): Locator {
  return page.getByRole("row", { name: new RegExp(label) });
}

async function agree(page: Page, mode: string, fields: Record<string, string> = {}) {
  await page.getByRole("button", { name: sheet("open") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(sheet("mode")).selectOption({ label: mode });
  for (const [label, value] of Object.entries(fields)) {
    await dialog.getByLabel(label, { exact: false }).fill(value);
  }
  await dialog.getByRole("button", { name: sheet("submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: sheet("done") })).toHaveCount(1);
}

test("an hourly fee lists its entries and approves a selection, and passes axe", async ({
  page,
}) => {
  await openTeam(page, shop);
  await expect(page.getByText("Fran Freelance")).toBeVisible();
  await expect(page.getByText(/Por horas: 35,00\s€ la hora\. Tope de 60 h\./)).toBeVisible();
  await expect(row(page, "Catálogo de productos")).toContainText(table("statuses.approved"));
  await expect(row(page, "Ajustes de la portada")).toContainText(table("statuses.pending"));

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);

  await page.getByLabel(table("select").replace("{label}", "Ajustes de la portada")).check();
  await page.getByLabel(table("select").replace("{label}", "Formulario de contacto")).check();
  await page.getByRole("button", { name: table("approve").replace("{count}", "2") }).click();
  await expect(row(page, "Ajustes de la portada")).toContainText(table("statuses.approved"));
  await expect(row(page, "Formulario de contacto")).toContainText(table("statuses.approved"));
  await expect(
    page.getByRole("status").filter({ hasText: table("approved").replace("{count}", "2") }),
  ).toHaveCount(1);
});

test("an entry is rejected with a reason and a pending one can be deleted", async ({ page }) => {
  await openTeam(page, shop);
  await page
    .getByRole("button", {
      name: table("rejectOpenFor").replace("{label}", "Ajustes de la portada"),
    })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: table("rejectSubmit") }).click();
  await expect(dialog.getByText(errors("reason"))).toBeVisible();
  await dialog.getByLabel(table("rejectReason")).fill("Horas duplicadas");
  await expectNoViolations(page);
  await dialog.getByRole("button", { name: table("rejectSubmit") }).click();
  const rejected = row(page, "Ajustes de la portada");
  await expect(rejected).toContainText(table("statuses.rejected"));
  await expect(rejected).toContainText("Horas duplicadas");

  await page
    .getByRole("button", { name: table("deleteFor").replace("{label}", "Formulario de contacto") })
    .click();
  await expect(row(page, "Formulario de contacto")).toHaveCount(0);
});

test("the mode cannot change while the fee has live entries", async ({ page }) => {
  await openTeam(page, shop);
  await page.getByRole("button", { name: sheet("openEdit") }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(sheet("mode"))).toBeDisabled();
  await expect(dialog.getByText(sheet("modeLocked"))).toBeVisible();
});

test("a milestone fee takes milestones and approves a delivered one", async ({ page, request }) => {
  await openTeam(page, landing);
  await expect(page.getByText(f("noFee"))).toBeVisible();
  await agree(page, sheet("modes.milestones"));
  await page.getByRole("button", { name: add("open") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(add("label")).fill("Diseño de la portada");
  await dialog.getByLabel(add("amount")).fill("300");
  await dialog.getByRole("button", { name: add("submit") }).click();
  await expect(row(page, "Diseño de la portada")).toContainText(table("statuses.pending"));

  await request.post(`${mockOrigin}/__auth/projects-deliver?tag=${tag.value}`, {
    data: { label: "Diseño de la portada" },
  });
  await page.reload();
  const delivered = row(page, "Diseño de la portada");
  await expect(delivered).toContainText(table("statuses.delivered"));
  await page.getByLabel(table("select").replace("{label}", "Diseño de la portada")).check();
  await page.getByRole("button", { name: table("approve").replace("{count}", "1") }).click();
  await expect(delivered).toContainText(table("statuses.approved"));
});

test("a fixed fee preloads one entry and accepts partials up to the total", async ({ page }) => {
  await openTeam(page, landing);
  await agree(page, sheet("modes.fixed"), { [sheet("amount")]: "900" });
  const total = row(page, sheet("fixedItemLabel"));
  await expect(total).toContainText("900,00");
  await page
    .getByRole("button", { name: table("deleteFor").replace("{label}", sheet("fixedItemLabel")) })
    .click();
  await expect(total).toHaveCount(0);

  const addPartial = async (label: string, amount: string) => {
    await page.getByRole("button", { name: add("open") }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(add("label")).fill(label);
    await dialog.getByLabel(add("amount")).fill(amount);
    await dialog.getByRole("button", { name: add("submit") }).click();
    return dialog;
  };

  await addPartial("Primera parte", "600");
  await expect(row(page, "Primera parte")).toContainText("600,00");
  const dialog = await addPartial("Segunda parte", "400");
  await expect(dialog.getByText(errors("fee_amount_exceeded"))).toBeVisible();
  await dialog.getByLabel(add("amount")).fill("300");
  await dialog.getByRole("button", { name: add("submit") }).click();
  await expect(row(page, "Segunda parte")).toContainText("300,00");
});

test("a project without freelance explains that a fee needs one", async ({ page }) => {
  await signInAdmin(
    page,
    tag,
    `?next=${encodeURIComponent(path("60000000-0000-4000-8000-000000000003"))}`,
  );
  await expect(page.getByText(f("noFreelance"))).toBeVisible();
});
