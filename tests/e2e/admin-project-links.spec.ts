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
const l = (name: string) => d(`links.${name}`);
const m = (name: string) => d(`team.${name}`);

const shop = "60000000-0000-4000-8000-000000000001";
const landing = "60000000-0000-4000-8000-000000000002";
const linksPath = `/es/admin/proyectos/${shop}?tab=enlaces`;
const teamPath = (id: string) => `/es/admin/proyectos/${id}?tab=equipo`;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.101" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function open(page: Page, path: string, heading: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function names(page: Page) {
  return page.getByRole("region", { name: l("region") }).locator("li > div > p:first-child");
}

async function calls(page: Page) {
  const response = await page.request.get(`${mockOrigin}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as {
    projects: { name: string; args?: Record<string, unknown>; body?: Record<string, unknown> }[];
    invite: Record<string, unknown>[];
  };
}

test("the links tab lists the links in order with safe external anchors and passes axe", async ({
  page,
}) => {
  await open(page, linksPath, "Tienda de Carla");
  await expect(names(page)).toHaveText(["Versión de pruebas", "Diseño en Figma"]);
  const anchor = page.getByRole("link", { name: /staging\.example\.com/ });
  await expect(anchor).toHaveAttribute("href", "https://staging.example.com/");
  await expect(anchor).toHaveAttribute("target", "_blank");
  await expect(anchor).toHaveAttribute("rel", /noopener/);
  await expect(page.getByText("Aquí ves el avance antes de publicar.")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
});

test("a link is added, an http address is refused inline and a duplicate is reported", async ({
  page,
}) => {
  await open(page, linksPath, "Tienda de Carla");
  await page.getByRole("button", { name: l("add"), exact: true }).click();
  const form = page.getByRole("button", { name: l("form.submitAdd") });
  await expect(page.getByLabel(l("form.name"), { exact: true })).toBeFocused();

  await page.getByLabel(l("form.name"), { exact: true }).fill("Repositorio");
  await page.getByLabel(l("form.url"), { exact: true }).fill("http://github.com/ejemplo");
  await form.click();
  await expect(page.getByLabel(l("form.url"), { exact: true })).toBeFocused();
  await expect(page.getByText(l("errors.url"))).toBeVisible();
  expect((await calls(page)).projects.filter((call) => call.name === "insert-link")).toHaveLength(
    0,
  );

  await page.getByLabel(l("form.url"), { exact: true }).fill("https://staging.example.com/");
  await form.click();
  await expect(page.getByText(l("errors.duplicate_url"))).toBeVisible();

  await page.getByLabel(l("form.url"), { exact: true }).fill("https://github.com/ejemplo");
  await page.getByLabel(l("form.usage")).fill("El código del proyecto");
  await form.click();
  await expect(names(page)).toHaveText(["Versión de pruebas", "Diseño en Figma", "Repositorio"]);
  await expect(page.getByText("El código del proyecto")).toBeVisible();
});

test("links reorder with the keyboard and keep the focus on the moved link", async ({ page }) => {
  await open(page, linksPath, "Tienda de Carla");
  const down = page.getByRole("button", {
    name: l("down").replace("{name}", "Versión de pruebas"),
  });
  const up = page.getByRole("button", { name: l("up").replace("{name}", "Versión de pruebas") });
  await down.focus();
  await page.keyboard.press("Enter");
  await expect(names(page)).toHaveText(["Diseño en Figma", "Versión de pruebas"]);
  await expect(down).toBeDisabled();
  await expect(up).toBeFocused();

  await page.keyboard.press("Space");
  await expect(names(page)).toHaveText(["Versión de pruebas", "Diseño en Figma"]);
  await expect(up).toBeDisabled();
  await expect(down).toBeFocused();
});

test("editing changes a link and deleting asks for confirmation", async ({ page }) => {
  await open(page, linksPath, "Tienda de Carla");
  await page
    .getByRole("button", { name: l("editFor").replace("{name}", "Diseño en Figma") })
    .click();
  await page.getByLabel(l("form.name"), { exact: true }).fill("Diseño final");
  await page.getByRole("button", { name: l("form.submitEdit") }).click();
  await expect(names(page)).toHaveText(["Versión de pruebas", "Diseño final"]);

  await page
    .getByRole("button", { name: l("deleteFor").replace("{name}", "Diseño final") })
    .click();
  await page.getByRole("button", { name: l("cancel") }).click();
  await expect(names(page)).toHaveCount(2);

  await page
    .getByRole("button", { name: l("deleteFor").replace("{name}", "Diseño final") })
    .click();
  await page
    .getByRole("group", { name: l("delete") })
    .getByRole("button", { name: l("delete") })
    .click();
  await expect(names(page)).toHaveText(["Versión de pruebas"]);
});

test("a project without links shows the empty hint", async ({ page }) => {
  await open(page, `/es/admin/proyectos/${landing}?tab=enlaces`, "Landing sin cuenta");
  await expect(page.getByText(l("empty"))).toBeVisible();
  await expectNoViolations(page);
});

test("the team tab shows the client and freelance and passes axe", async ({ page }) => {
  await open(page, teamPath(shop), "Tienda de Carla");
  await expect(page.getByRole("heading", { name: m("client.title") })).toBeVisible();
  await expect(page.getByText("Carla Client").first()).toBeVisible();
  await expect(page.getByLabel(m("freelance.field"))).toHaveValue(
    "00000000-0000-4000-8000-0000000000f2",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
});

test("the team tab links to the client room of the project in the chat", async ({ page }) => {
  await open(page, teamPath(shop), "Tienda de Carla");
  const link = page.getByRole("link", { name: m("client.room") });
  await expect(link).toHaveAttribute("href", "/es/admin/chat/c0000000-0000-4000-8000-000000000005");
  await link.click();
  await expect(page).toHaveURL(/\/es\/admin\/chat\/c0000000-0000-4000-8000-000000000005$/);
});

test("a project without an account invites the client with the project attached", async ({
  page,
}) => {
  await open(page, teamPath(landing), "Landing sin cuenta");
  await expect(page.getByText(m("client.none")).first()).toBeVisible();
  await page.getByRole("button", { name: m("invite.open"), exact: true }).click();
  const dialog = page.getByRole("dialog", { name: m("invite.title") });
  await expect(dialog.getByLabel(msg("admin.users.invite.role"))).toHaveCount(0);
  await expectNoViolations(page);
  await dialog
    .getByLabel(msg("admin.users.invite.email"))
    .fill(tag.mailbox("nuevo-cliente@example.com"));
  await dialog.getByRole("button", { name: msg("admin.users.invite.submit") }).click();
  await expect(dialog.getByText(msg("admin.users.invite.doneTitle"))).toBeVisible();

  const sent = (await calls(page)).invite[0];
  expect(sent).toMatchObject({ p_role: "client", p_project_id: landing });
});

test("an existing client and a freelance can be assigned", async ({ page }) => {
  await open(page, teamPath(landing), "Landing sin cuenta");
  await page.getByLabel(m("client.assign")).selectOption({ label: "Dario Cliente" });
  await page.getByRole("button", { name: m("client.assignSubmit") }).click();
  await expect(page.getByText("Dario Cliente").first()).toBeVisible();
  await expect(page.getByText(m("client.none"))).toHaveCount(0);

  await page.getByLabel(m("freelance.field")).selectOption({ label: "Fran Freelance" });
  await page.getByRole("button", { name: m("freelance.submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: m("freelance.saved") })).toHaveCount(1);
});
