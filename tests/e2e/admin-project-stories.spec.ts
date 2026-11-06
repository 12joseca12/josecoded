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
const s = (name: string) => d(`stories.${name}`);
const decide = (name: string) => s(`decide.${name}`);

const path = "/es/admin/proyectos/60000000-0000-4000-8000-000000000001?tab=historias";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.99" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
});

async function openStories(page: Page) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(`^${s("groups.proposed")}`) }),
  ).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function group(page: Page, name: string) {
  return page.getByRole("region", { name: new RegExp(`^${name}`) });
}

test("the stories tab shows the pending count and groups the stories and passes axe", async ({
  page,
}) => {
  await openStories(page);
  const nav = page.getByRole("navigation", { name: d("tabsLabel") });
  await expect(
    nav.getByRole("link", { name: d("tabs.storiesPending").replace("{count}", "1") }),
  ).toHaveAttribute("aria-current", "page");

  await expect(group(page, s("groups.proposed")).getByRole("article")).toHaveCount(1);
  await expect(group(page, s("groups.in_review")).getByRole("article")).toHaveCount(1);
  await expect(group(page, s("groups.decided")).getByRole("article")).toHaveCount(1);

  const review = group(page, s("groups.in_review")).getByRole("article");
  await expect(review).toContainText(s("outOfScope"));
  await expect(review).toContainText("12 h");
  await expect(review).toContainText(s("awaiting"));

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
});

test("accepting a story with a task moves it to the decided group and adds the task", async ({
  page,
}) => {
  await openStories(page);
  await page
    .getByRole("button", { name: decide("openFor").replace("{title}", "Buscador de productos") })
    .click();
  const dialog = page.getByRole("dialog");
  await expectNoViolations(page);
  await dialog.getByRole("button", { name: decide("submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: decide("done.in_tasks") })).toHaveCount(
    1,
  );
  await expect(dialog).toBeHidden();

  await expect(group(page, s("groups.decided")).getByRole("article")).toHaveCount(2);
  await expect(group(page, s("groups.proposed"))).toHaveCount(0);

  await page.goto("/es/admin/proyectos/60000000-0000-4000-8000-000000000001");
  await expect(page.getByText("Buscador de productos", { exact: true })).toBeVisible();
});

test("rejecting needs a reason", async ({ page }) => {
  await openStories(page);
  await page
    .getByRole("button", { name: decide("openFor").replace("{title}", "Buscador de productos") })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(decide("decision")).selectOption("reject");
  await dialog.getByRole("button", { name: decide("submit") }).click();
  await expect(dialog.getByLabel(decide("note"))).toBeFocused();
  await expect(dialog.getByText(decide("errors.note")).first()).toBeVisible();

  await dialog.getByLabel(decide("note")).fill("No encaja con el alcance");
  await dialog.getByRole("button", { name: decide("submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: decide("done.rejected") })).toHaveCount(
    1,
  );
  await expect(dialog).toBeHidden();
});

test("out of budget needs hours and amount and waits for the client", async ({ page }) => {
  await openStories(page);
  await page
    .getByRole("button", { name: decide("openFor").replace("{title}", "Buscador de productos") })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(decide("decision")).selectOption("out_of_scope");
  await dialog.getByRole("button", { name: decide("submit") }).click();
  await expect(dialog.getByLabel(decide("hours"), { exact: true })).toBeFocused();

  await dialog.getByLabel(decide("hours"), { exact: true }).fill("6");
  await dialog.getByLabel(decide("amount")).fill("240");
  await dialog.getByLabel(decide("note")).fill("Extra de búsqueda avanzada");
  await dialog.getByRole("button", { name: decide("submit") }).click();
  await expect(page.getByRole("status").filter({ hasText: decide("done.in_review") })).toHaveCount(
    1,
  );
  await expect(dialog).toBeHidden();

  await expect(group(page, s("groups.in_review")).getByRole("article")).toHaveCount(2);
});

test("a project without stories shows the empty state", async ({ page }) => {
  await signInAdmin(
    page,
    tag,
    `?next=${encodeURIComponent("/es/admin/proyectos/60000000-0000-4000-8000-000000000002?tab=historias")}`,
  );
  await expect(page.getByRole("heading", { name: s("empty.title") })).toBeVisible();
  await expectNoViolations(page);
});
