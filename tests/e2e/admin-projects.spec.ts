import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

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

const t = (name: string) => msg(`admin.projects.${name}`);
const sheet = (name: string) => t(`sheet.${name}`);

const next = encodeURIComponent("/es/admin/proyectos");

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.97" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: string) {
  await page.request.post(`${mockOrigin}/__auth/projects-mode?tag=${tag.value}`, {
    data: { mode },
  });
}

async function openProjects(page: Page) {
  await signInAdmin(page, tag, `?next=${next}`);
  await expect(page).toHaveURL(/\/es\/admin\/proyectos$/);
  await expect(page.getByRole("heading", { level: 1, name: t("title") })).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function calls(page: Page) {
  const response = await page.request.get(`${mockOrigin}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as {
    projects: { name: string; args?: unknown; body?: unknown }[];
  };
}

test("the projects page lists them with phase, progress and pending stories and passes axe", async ({
  page,
}) => {
  await openProjects(page);
  const table = page.getByRole("region", { name: t("table.region") });
  await expect(table.getByRole("row")).toHaveCount(4);

  const shop = table.getByRole("row", { name: /Tienda de Carla/ });
  await expect(shop).toContainText("Carla Client");
  await expect(shop).toContainText(t("phases.build"));
  await expect(shop).toContainText("2/8 · 25 %");
  await expect(shop).toContainText(t("table.storiesToDecide").replace("{count}", "1"));
  await expect(shop).toContainText("Fran Freelance");
  await expect(shop.getByRole("progressbar")).toHaveAttribute("value", "25");

  const landing = table.getByRole("row", { name: /Landing sin cuenta/ });
  await expect(landing).toContainText(t("table.noClient"));

  const closed = table.getByRole("row", { name: /Proyecto entregado/ });
  await expect(closed).toContainText(t("statuses.closed"));

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.getByRole("button", { name: sheet("create"), exact: true })).toBeVisible();
  await expectNoViolations(page);
});

test("the projects entry is enabled in the navigation", async ({ page }) => {
  await signInAdmin(page, tag);
  const rail = page.getByRole("navigation").first();
  await expect(rail.getByRole("link", { name: msg("admin.nav.projects") })).toBeVisible();
});

test("a closer cannot open the projects page", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/proyectos");
  expect(response?.status()).toBe(404);
});

test("an empty list invites to create the first project", async ({ page }) => {
  await setMode(page, "empty");
  await openProjects(page);
  await expect(page.getByRole("heading", { name: t("empty.title") })).toBeVisible();
  await expect(page.getByRole("button", { name: sheet("create"), exact: true })).toBeVisible();
  await expectNoViolations(page);
});

test("a failing read shows the error screen with a retry", async ({ page }) => {
  await setMode(page, "error");
  await openProjects(page);
  await expect(page.getByRole("heading", { name: t("error.title") })).toBeVisible();
  await setMode(page, "data");
  await page.getByRole("button", { name: t("error.retry") }).click();
  await expect(page.getByRole("region", { name: t("table.region") })).toBeVisible();
});

test("creating a project from a won opportunity adds it to the list", async ({ page }) => {
  await openProjects(page);
  await page.getByRole("button", { name: sheet("create"), exact: true }).click();
  const dialog = page.getByRole("dialog", { name: sheet("createTitle") });
  await expect(dialog.getByLabel(sheet("name"))).toBeVisible();
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByLabel(sheet("name"))).toBeFocused();
  await expect(dialog.getByText(sheet("errors.name"))).toBeVisible();

  await dialog.getByLabel(sheet("name")).fill("Web de Bruno");
  await dialog.getByLabel(sheet("deal"), { exact: true }).selectOption({ label: "Bruno Banco" });
  await dialog.getByLabel(sheet("offer"), { exact: true }).selectOption("web-negocio");
  await dialog
    .getByLabel(sheet("freelance"), { exact: true })
    .selectOption({ label: "Fran Freelance" });
  await dialog.getByLabel(sheet("startedAt")).fill("2026-11-10");
  await dialog.getByLabel(sheet("dueAt")).fill("2026-10-01");
  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByLabel(sheet("dueAt"))).toBeFocused();
  await expect(dialog.getByText(sheet("errors.dueAt"))).toBeVisible();

  await dialog.getByLabel(sheet("dueAt")).fill("2026-12-20");
  await dialog.getByLabel(sheet("brief")).fill("Brief de prueba");
  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByRole("heading", { name: sheet("doneCreate") })).toBeFocused();
  await dialog
    .getByRole("button", { name: sheet("close"), exact: true })
    .first()
    .click();
  await expect(dialog).toBeHidden();

  const row = page
    .getByRole("region", { name: t("table.region") })
    .getByRole("row", { name: /Web de Bruno/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Fran Freelance");

  const made = (await calls(page)).projects.find((call) => call.name === "create_project");
  expect(made?.args).toMatchObject({
    p_name: "Web de Bruno",
    p_deal_id: "30000000-0000-4000-8000-0000000000a2",
    p_offer_slug: "web-negocio",
    p_brief: "Brief de prueba",
    p_started_at: "2026-11-10",
    p_due_at: "2026-12-20",
  });
});

test("a database refusal shows inline on the field it belongs to", async ({ page }) => {
  await openProjects(page);
  await page.request.post(`${mockOrigin}/__auth/projects-rpc-error?tag=${tag.value}`, {
    data: { error: { code: "P0001", message: "deal_not_won" } },
  });
  await page.getByRole("button", { name: sheet("create"), exact: true }).click();
  const dialog = page.getByRole("dialog", { name: sheet("createTitle") });
  await dialog.getByLabel(sheet("name")).fill("Sin ganar");
  await dialog.getByLabel(sheet("deal"), { exact: true }).selectOption({ label: "Bruno Banco" });
  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByLabel(sheet("deal"), { exact: true })).toBeFocused();
  await expect(dialog.getByText(sheet("errors.deal_not_won"))).toBeVisible();
});

test("editing a project renames it in the list", async ({ page }) => {
  await openProjects(page);
  await page
    .getByRole("button", { name: sheet("editFor").replace("{name}", "Landing sin cuenta") })
    .click();
  const dialog = page.getByRole("dialog", { name: sheet("editTitle") });
  await expect(dialog.getByLabel(sheet("name"))).toHaveValue("Landing sin cuenta");
  await expect(dialog.getByLabel(sheet("deal"), { exact: true })).toHaveCount(0);
  await dialog.getByLabel(sheet("name")).fill("Landing renombrada");
  await dialog.getByRole("button", { name: sheet("submitEdit") }).click();
  await expect(dialog.getByText(sheet("doneEdit"))).toBeVisible();
  await dialog
    .getByRole("button", { name: sheet("close"), exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("region", { name: t("table.region") })
      .getByRole("row", { name: /Landing renombrada/ }),
  ).toBeVisible();
});
