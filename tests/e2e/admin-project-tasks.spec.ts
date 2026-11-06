import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

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

const d = (name: string) => msg(`admin.projects.detail.${name}`);
const head = (name: string) => d(`head.${name}`);
const board = (name: string) => d(`tasks.board.${name}`);
const sheet = (name: string) => d(`tasks.sheet.${name}`);

const shopId = "60000000-0000-4000-8000-000000000001";
const shopPath = `/es/admin/proyectos/${shopId}`;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.98" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function openProject(page: Page, path = shopPath) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
}

function column(page: Page, phase: string) {
  return page.getByRole("region", { name: new RegExp(`^${phase}`) });
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function titles(page: Page, phase: string) {
  return column(page, phase).getByRole("listitem").locator("p:first-child").allTextContents();
}

test("the list links to the project, which shows its head, brief and board and passes axe", async ({
  page,
}) => {
  await signInAdmin(page, tag, `?next=${encodeURIComponent("/es/admin/proyectos")}`);
  await page.getByRole("link", { name: "Tienda de Carla" }).click();
  await expect(page).toHaveURL(new RegExp(`${shopPath}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
  await expect(page.getByText("2/8 · 25 %")).toBeVisible();
  await expect(page.getByLabel(head("phase"), { exact: true })).toHaveValue("build");
  await expect(page.getByText("Tienda pequeña con catálogo y contacto.")).toBeVisible();
  await expect(column(page, head("phases.discover")).getByRole("listitem")).toHaveCount(2);
  await expect(column(page, head("phases.design")).getByRole("listitem")).toHaveCount(3);
  await expect(column(page, head("phases.build")).getByRole("listitem")).toHaveCount(3);
  await expect(column(page, head("phases.publish"))).toContainText(board("empty"));

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(column(page, head("phases.build"))).toBeVisible();
  await expectNoViolations(page);
});

test("an unknown or malformed project id shows the not found screen", async ({ page }) => {
  await signInAdmin(page, tag);
  for (const id of ["60000000-0000-4000-8000-0000000000ff", "nope"]) {
    await page.goto(`/es/admin/proyectos/${id}`);
    await expect(page.getByRole("heading", { name: msg("errors.notFound.title") })).toBeVisible();
  }
});

test("changing the phase is saved and survives a reload", async ({ page }) => {
  await openProject(page);
  await page.getByLabel(head("phase"), { exact: true }).selectOption("publish");
  await expect(page.getByText(head("phaseSaved"))).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(head("phase"), { exact: true })).toHaveValue("publish");
});

test("archiving asks for confirmation, blocks the phase and can be undone", async ({ page }) => {
  await openProject(page);
  await page.getByRole("button", { name: head("archive"), exact: true }).click();
  await page.getByRole("button", { name: head("cancel") }).click();
  await expect(page.getByRole("button", { name: head("archive"), exact: true })).toBeVisible();

  await page.getByRole("button", { name: head("archive"), exact: true }).click();
  await page
    .getByRole("group", { name: head("archive") })
    .getByRole("button", { name: head("archive") })
    .click();
  await expect(page.getByText(head("archived"))).toBeVisible();
  await expect(page.getByLabel(head("phase"), { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: head("restore") }).click();
  await expect(page.getByText(head("restored"))).toBeVisible();
  await expect(page.getByLabel(head("phase"), { exact: true })).toBeEnabled();
});

test("a task can be added to a phase and assigned to the client", async ({ page }) => {
  await openProject(page);
  const publish = column(page, head("phases.publish"));
  await publish.getByRole("button", { name: sheet("create") }).click();
  const dialog = page.getByRole("dialog", { name: sheet("createTitle") });
  await expectNoViolations(page);

  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByLabel(sheet("title"))).toBeFocused();
  await expect(dialog.getByText(sheet("errors.title"))).toBeVisible();

  await dialog.getByLabel(sheet("title")).fill("Conectar el dominio");
  await expect(dialog.getByLabel(sheet("phase"))).toHaveValue("publish");
  await dialog.getByLabel(sheet("assignee")).selectOption({ label: "Carla Client" });
  await dialog.getByRole("button", { name: sheet("submitCreate") }).click();
  await expect(dialog.getByText(sheet("done"))).toBeVisible();
  await dialog
    .getByRole("button", { name: sheet("close"), exact: true })
    .first()
    .click();

  const card = publish.getByRole("listitem").filter({ hasText: "Conectar el dominio" });
  await expect(card).toContainText(board("assignedTo").replace("{name}", "Carla Client"));
  await expect(card).toContainText(sheet("statuses.todo"));
});

test("tasks move between phases and inside a phase with the keyboard controls", async ({
  page,
}) => {
  await openProject(page);
  const build = head("phases.build");
  const before = await titles(page, build);
  expect(before).toEqual(["Tarea 6", "Tarea 7", "Tarea 8"]);

  await page.getByRole("button", { name: board("down").replace("{title}", "Tarea 6") }).click();
  await expect.poll(() => titles(page, build)).toEqual(["Tarea 7", "Tarea 6", "Tarea 8"]);

  await page.getByRole("button", { name: board("up").replace("{title}", "Tarea 8") }).click();
  await expect.poll(() => titles(page, build)).toEqual(["Tarea 7", "Tarea 8", "Tarea 6"]);

  await page.getByLabel(board("moveToFor").replace("{title}", "Tarea 7")).selectOption("publish");
  await expect.poll(() => titles(page, head("phases.publish"))).toEqual(["Tarea 7"]);
  await expect.poll(() => titles(page, build)).toEqual(["Tarea 8", "Tarea 6"]);

  await expect(
    page.getByRole("button", { name: board("up").replace("{title}", "Tarea 8") }),
  ).toBeDisabled();
});

test("editing a task changes its status and deleting asks for confirmation", async ({ page }) => {
  await openProject(page);
  await page.getByRole("button", { name: sheet("editFor").replace("{title}", "Tarea 3") }).click();
  const dialog = page.getByRole("dialog", { name: sheet("editTitle") });
  await expect(dialog.getByLabel(sheet("title"))).toHaveValue("Tarea 3");
  await dialog.getByLabel(sheet("status")).selectOption("doing");
  await dialog.getByRole("button", { name: sheet("submitEdit") }).click();
  await expect(dialog.getByText(sheet("done"))).toBeVisible();

  await dialog.getByLabel(sheet("status")).selectOption("todo");
  await dialog.getByRole("button", { name: sheet("submitEdit") }).click();
  await expect(dialog.getByText(sheet("done"))).toBeVisible();
  await dialog.getByRole("button", { name: sheet("delete"), exact: true }).click();
  await dialog
    .getByRole("group", { name: sheet("delete") })
    .getByRole("button", { name: sheet("delete") })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Tarea 3", { exact: true })).toHaveCount(0);
});

test("a done task cannot be deleted from the sheet", async ({ page }) => {
  await openProject(page);
  await page.getByRole("button", { name: sheet("editFor").replace("{title}", "Tarea 1") }).click();
  const dialog = page.getByRole("dialog", { name: sheet("editTitle") });
  await expect(dialog.getByRole("button", { name: sheet("delete"), exact: true })).toHaveCount(0);
});
