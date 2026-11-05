import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import { staffNav } from "../../src/lib/staff/nav";
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

const overview = (name: string) => msg(`admin.overview.${name}`);
const audit = (name: string) => msg(`admin.audit.${name}`);

const leadId = "10000000-0000-4000-8000-000000000001";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.91" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, string>) {
  await page.request.post(`${mock}/__auth/overview-mode?tag=${tag.value}`, { data: mode });
}

async function omenMode(page: Page, mode: Record<string, string>) {
  await page.request.post(`${mock}/__auth/system-mode?tag=${tag.value}`, { data: mode });
}

async function seed(page: Page, entries: Record<string, unknown>[]) {
  await page.request.post(`${mock}/__auth/audit-seed?tag=${tag.value}`, { data: entries });
}

async function open(page: Page, path: string, title: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`));
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function cell(page: Page, key: string) {
  return page.getByRole("listitem").filter({ hasText: overview(`cells.labels.${key}`) });
}

const changes = [
  {
    table_name: "leads",
    row_id: leadId,
    action: "update",
    before: { status: "new", assigned_to: null },
    after: { status: "assigned", assigned_to: "00000000-0000-4000-8000-0000000000c1" },
  },
  {
    table_name: "deals",
    row_id: "30000000-0000-4000-8000-000000000001",
    action: "insert",
    before: null,
    after: { stage: "lead" },
  },
  {
    table_name: "profiles",
    row_id: "00000000-0000-4000-8000-0000000000c2",
    action: "delete",
    actor_name: null,
    before: { role: "closer" },
    after: null,
  },
];

test("the overview shows counters, Omen and recent changes and passes axe at 1440 and 375", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/es/admin", overview("title"));
  await seed(page, changes);
  await omenMode(page, { omen: "live" });
  await page.reload();
  await expect(cell(page, "leads_new")).toContainText("3");
  await expect(cell(page, "users_active")).toContainText("4");
  await expect(page.getByRole("heading", { name: msg("admin.system.omen.title") })).toBeVisible();
  const recent = page.getByRole("list", { name: audit("list.region") });
  await expect(recent.locator(":scope > li")).toHaveCount(changes.length);
  await expect(recent).toContainText(audit("tables.leads"));
  await expectClean(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectClean(page);
});

test("a counter missing from the payload shows a dash and has no link", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  const missing = cell(page, "payments_overdue");
  await expect(missing).toContainText(overview("cells.unknown"));
  await expect(missing.getByRole("link")).toHaveCount(0);
  await expect(cell(page, "leads_new").getByRole("link")).toHaveAttribute(
    "href",
    "/es/admin/interesados?status=new",
  );
});

test("a counter links to its filtered list", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  await cell(page, "leads_waiting_admin").getByRole("link").click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados\?status=waiting$/);
});

test("every ready section is linked from the overview", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  const sections = page.getByRole("region", { name: overview("sections.title") });
  await expect(sections.getByRole("link")).toHaveCount(
    staffNav.admin.filter((entry) => entry.ready && entry.key !== "overview").length,
  );
  await expect(sections.getByRole("link", { name: msg("admin.nav.audit") })).toBeVisible();
});

test("full counters show the accrued amount and zero state", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  await setMode(page, { countersMode: "full" });
  await page.reload();
  await expect(cell(page, "accrued_pending_count")).toContainText("€");
  await expect(cell(page, "jobs_failed").getByRole("link")).toHaveAttribute(
    "href",
    "/es/admin/sistema?estado=failed",
  );
  await setMode(page, { countersMode: "zero" });
  await page.reload();
  await expect(cell(page, "leads_new")).toContainText("0");
});

test("counters not yet in the database say so without breaking the page", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  await setMode(page, { countersMode: "missing", auditMode: "missing" });
  await page.reload();
  await expect(page.getByText(overview("cells.unavailable.title"))).toBeVisible();
  await expect(cell(page, "leads_new")).toContainText(overview("cells.unknown"));
  await expect(page.getByText(audit("unavailable.title"))).toBeVisible();
  await expect(page.getByRole("heading", { name: msg("admin.system.omen.title") })).toBeVisible();
  await expectClean(page);
});

test("a failing counters call offers a retry that recovers", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  await setMode(page, { countersMode: "error", auditMode: "error" });
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: overview("cells.error.title") }),
  ).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: audit("error.title") })).toBeVisible();
  await setMode(page, { countersMode: "partial", auditMode: "data" });
  await page
    .getByRole("alert")
    .filter({ hasText: overview("cells.error.title") })
    .getByRole("button", { name: overview("cells.error.retry") })
    .click();
  await expect(cell(page, "leads_new")).toContainText("3");
});

test("the recent changes link opens the audit log", async ({ page }) => {
  await open(page, "/es/admin", overview("title"));
  await page.getByRole("link", { name: overview("recent.all") }).click();
  await expect(page).toHaveURL(/\/es\/admin\/auditoria$/);
});
