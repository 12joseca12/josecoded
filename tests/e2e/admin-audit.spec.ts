import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

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

async function seed(page: Page, entries: Record<string, unknown>[]) {
  await page.request.post(`${mock}/__auth/audit-seed?tag=${tag.value}`, { data: entries });
}

async function open(page: Page, path: string, title: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`));
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function reopen(page: Page, path: string, title: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
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

test("a closer cannot open the audit log", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/auditoria");
  expect(response?.status()).toBe(404);
});

test("the audit log lists changes, filters from the URL and passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/es/admin/auditoria", audit("title"));
  await expect(page.getByText(audit("empty.title"))).toBeVisible();
  await seed(page, changes);
  await reopen(page, "/es/admin/auditoria", audit("title"));
  const list = page.getByRole("list", { name: audit("list.region") });
  await expect(list.locator(":scope > li")).toHaveCount(3);
  await expect(list).toContainText("status: new → assigned");
  await expect(list).toContainText(audit("list.system"));
  await expectClean(page);

  await reopen(page, "/es/admin/auditoria?tabla=deals", audit("title"));
  await expect(list.locator(":scope > li")).toHaveCount(1);
  await expect(page.getByLabel(audit("filters.table"))).toHaveValue("deals");

  await reopen(page, "/es/admin/auditoria?accion=delete", audit("title"));
  await expect(list.locator(":scope > li")).toHaveCount(1);
  await expect(list).toContainText(audit("tables.profiles"));

  await reopen(page, "/es/admin/auditoria?tabla=deals&accion=delete", audit("title"));
  await expect(page.getByText(audit("emptyFiltered.title"))).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await expectClean(page);
});

test("the filter form writes the filters into the URL", async ({ page }) => {
  await open(page, "/es/admin/auditoria", audit("title"));
  await seed(page, changes);
  await page.reload();
  await page.getByLabel(audit("filters.table")).selectOption("leads");
  await page.getByRole("button", { name: audit("filters.submit") }).click();
  await expect(page).toHaveURL(/\/es\/admin\/auditoria\?tabla=leads(&accion=)?$/);
  await expect(
    page.getByRole("list", { name: audit("list.region") }).locator(":scope > li"),
  ).toHaveCount(1);
  await page.getByRole("link", { name: audit("filters.clear") }).click();
  await expect(page).toHaveURL(/\/es\/admin\/auditoria$/);
});

test("the audit log pages by raising the limit in the URL", async ({ page }) => {
  await open(page, "/es/admin/auditoria", audit("title"));
  await seed(
    page,
    Array.from({ length: 120 }, (_, index) => ({
      table_name: "contacts",
      action: "insert",
      row_id: `40000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    })),
  );
  await page.reload();
  const items = page.getByRole("list", { name: audit("list.region") }).locator(":scope > li");
  await expect(items).toHaveCount(50);
  await page.getByRole("link", { name: audit("more") }).click();
  await expect(page).toHaveURL(/limite=100$/);
  await expect(items).toHaveCount(100);
  await page.getByRole("link", { name: audit("more") }).click();
  await expect(page).toHaveURL(/limite=150$/);
  await expect(items).toHaveCount(120);
  await expect(page.getByRole("link", { name: audit("more") })).toHaveCount(0);
});

test("an unavailable audit log says so", async ({ page }) => {
  await open(page, "/es/admin/auditoria", audit("title"));
  await setMode(page, { auditMode: "missing" });
  await page.reload();
  await expect(page.getByText(audit("unavailable.title"))).toBeVisible();
  await setMode(page, { auditMode: "error" });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: audit("error.title") })).toBeVisible();
});

test("the lead record lists its own history", async ({ page }) => {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(`/es/admin/interesados/${leadId}`)}`);
  await expect(page.getByRole("heading", { level: 2, name: audit("history.title") })).toBeVisible();
  await expect(page.getByText(audit("history.empty"))).toBeVisible();
  await seed(page, changes);
  await page.reload();
  const history = page.getByRole("list", { name: audit("list.region") });
  await expect(history.locator(":scope > li")).toHaveCount(1);
  await expect(history).toContainText("status: new → assigned");
  await expectClean(page);
  await setMode(page, { auditMode: "missing" });
  await page.reload();
  await expect(page.getByText(audit("history.unavailable"))).toBeVisible();
  await setMode(page, { auditMode: "error" });
  await page.reload();
  await expect(page.getByText(audit("history.error"))).toBeVisible();
});
