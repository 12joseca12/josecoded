import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
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

const leads = (name: string) => msg(`admin.leads.${name}`);

const ids = {
  cara: "10000000-0000-4000-8000-000000000003",
  felix: "10000000-0000-4000-8000-000000000002",
  hilda: "10000000-0000-4000-8000-000000000001",
  wanda: "10000000-0000-4000-8000-0000000000ff",
};
const contactIds = { ada: "20000000-0000-4000-8000-0000000000a1" };
const cleo = "00000000-0000-4000-8000-0000000000c1";
const dani = "00000000-0000-4000-8000-0000000000c2";

interface Calls {
  leadInserts: { body: Record<string, unknown>; level: string | null }[];
  rpc: { name: string; args: Record<string, unknown> }[];
}

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.88" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function calls(page: Page): Promise<Calls> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as Calls;
}

async function openList(page: Page, query = "") {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(`/es/admin/interesados${query}`)}`);
  await expect(page.getByRole("heading", { level: 1, name: leads("title") })).toBeVisible();
}

async function openDetail(page: Page, id: string) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(`/es/admin/interesados/${id}`)}`);
  await expect(page).toHaveURL(new RegExp(`/es/admin/interesados/${id}$`));
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function bodyRows(page: Page) {
  return page.getByRole("table").locator("tbody tr");
}

function tab(page: Page, name: string, count: number) {
  return page
    .getByRole("navigation", { name: leads("tabs.label") })
    .getByRole("link", { name: `${name} ${count}` });
}

test("the tabs count each state and filter by it in the URL", async ({ page }) => {
  await openList(page);
  await expect(bodyRows(page)).toHaveCount(5);
  await expect(tab(page, leads("tabs.all"), 5)).toHaveAttribute("aria-current", "page");
  await expect(tab(page, leads("tabs.new"), 1)).toBeVisible();
  await expect(tab(page, leads("tabs.waiting"), 1)).toBeVisible();
  await expect(tab(page, leads("tabs.assigned"), 2)).toBeVisible();
  await expect(tab(page, leads("tabs.converted"), 0)).toBeVisible();
  await expect(tab(page, leads("tabs.discarded"), 1)).toBeVisible();
  await expectClean(page);

  await tab(page, leads("tabs.waiting"), 1).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados\?status=waiting$/);
  await expect(bodyRows(page)).toHaveCount(1);
  await expect(bodyRows(page).first()).toContainText("Wanda Waiting");
  await expect(tab(page, leads("tabs.waiting"), 1)).toHaveAttribute("aria-current", "page");

  await tab(page, leads("tabs.assigned"), 2).click();
  await expect(bodyRows(page)).toHaveCount(2);
  await expect(bodyRows(page).first()).toContainText("Félix Freelance");
});

test("the filter bar keeps its values in the URL and survives a reload", async ({ page }) => {
  await openList(page);
  const bar = page.getByRole("search", { name: leads("filters.label") });
  await bar.getByLabel(leads("filters.q")).fill("hilda");
  await bar.getByRole("button", { name: leads("filters.submit") }).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados\?q=hilda(&via=&source=&owner=)?$/);
  await expect(bodyRows(page)).toHaveCount(1);
  await expect(bodyRows(page).first()).toContainText("Hilda Hiring");
  await expect(tab(page, leads("tabs.all"), 1)).toBeVisible();

  await page.reload();
  await expect(bar.getByLabel(leads("filters.q"))).toHaveValue("hilda");
  await expect(bodyRows(page)).toHaveCount(1);

  await bar.getByRole("link", { name: leads("filters.clear") }).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(bodyRows(page)).toHaveCount(5);
});

test("via, source and owner combine with the tab and show an honest empty state", async ({
  page,
}) => {
  await openList(page, `?via=freelance&owner=${cleo}`);
  await expect(bodyRows(page)).toHaveCount(1);
  await expect(bodyRows(page).first()).toContainText("Félix Freelance");
  const bar = page.getByRole("search", { name: leads("filters.label") });
  await expect(bar.getByLabel(leads("filters.via"))).toHaveValue("freelance");
  await expect(bar.getByLabel(leads("filters.owner"))).toHaveValue(cleo);

  await bar.getByLabel(leads("filters.via")).selectOption("hiring");
  await bar.getByLabel(leads("filters.source")).selectOption("form");
  await bar.getByRole("button", { name: leads("filters.submit") }).click();
  await expect(page).toHaveURL(new RegExp(`via=hiring&source=form&owner=${cleo}`));
  await expect(page.getByRole("heading", { name: leads("emptyFiltered.title") })).toBeVisible();
  await expectClean(page);

  await page.goto("/es/admin/interesados?owner=none&status=new");
  await expect(bodyRows(page)).toHaveCount(1);
  await expect(bodyRows(page).first()).toContainText("Cara Pack");
  await page.goto("/es/admin/interesados?via=bogus&owner=nope&status=nope");
  await expect(bodyRows(page)).toHaveCount(5);
});

test("a lead opens its record from the list and the record passes axe at 1440 and 375", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openList(page);
  await page.getByRole("link", { name: "Cara Pack" }).click();
  await expect(page).toHaveURL(new RegExp(`/es/admin/interesados/${ids.cara}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Cara Pack" })).toBeVisible();

  const record = page.locator("#content");
  await expect(record.getByText("Quiero una web con área de clientes.")).toBeVisible();
  await expect(record.getByText("cara@example.com")).toBeVisible();
  await expect(record.getByText("+34 600 000 003")).toBeVisible();
  await expect(record.getByText("Cara SL")).toBeVisible();
  await expect(record.getByText("Negocio", { exact: true })).toBeVisible();
  await expect(record.getByText("Cuentas y permisos", { exact: false })).toBeVisible();
  await expect(record.getByText("Tengo una idea y nada hecho")).toBeVisible();
  await expect(record.getByText("Cobrar dentro (pagos o suscripciones)")).toBeVisible();
  await expect(record.getByText(leads("source.form"))).toBeVisible();
  await expect(record.getByText(msg("admin.leads.detail.origin.locales.es"))).toBeVisible();
  await expect(
    record.getByRole("heading", { level: 2, name: leads("detail.owner.title") }),
  ).toBeVisible();
  await expect(record.getByText(leads("unassigned"))).toBeVisible();
  await expect(
    record.getByRole("heading", { level: 2, name: msg("admin.audit.history.title") }),
  ).toBeVisible();
  await expect(record.getByText(msg("admin.audit.history.empty"))).toBeVisible();
  await expectClean(page);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Cara Pack" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("the record shows the fields of each way, who assigned and the linked deal", async ({
  page,
}) => {
  await openDetail(page, ids.felix);
  const record = page.locator("#content");
  await expect(record.getByText("2026-12-01")).toBeVisible();
  await expect(record.getByRole("definition").filter({ hasText: "Cleo Closer" })).toBeVisible();
  await expect(record.getByText("Jose Enrolled")).toBeVisible();

  await page.goto(`/es/admin/interesados/${ids.hilda}`);
  await expect(record.getByText("Acme")).toBeVisible();
  await expect(record.getByRole("link", { name: "https://example.com/oferta" })).toHaveAttribute(
    "rel",
    /noopener/,
  );
  await expect(record.getByText(leads("detail.owner.automatic"))).toBeVisible();
  await expect(
    record.getByText(leads("detail.owner.contact"), { exact: true }).first(),
  ).toBeVisible();
  await expect(record.getByText(leads("detail.stage.proposal"))).toBeVisible();
  await expect(record.getByRole("link", { name: leads("detail.owner.contactLink") })).toHaveCount(
    1,
  );
  await expect(
    record.getByRole("link", { name: leads("detail.owner.contactLink") }),
  ).toHaveAttribute("href", `/es/crm/contactos/${contactIds.ada}`);

  await page.goto(`/es/admin/interesados/${ids.wanda}`);
  await expect(record.getByText(leads("detail.owner.waiting"))).toBeVisible();
  await expect(record.getByText(leads("detail.message.empty"))).toBeVisible();
  await expectClean(page);
});

test("an admin assigns and discards from the record", async ({ page }) => {
  await openDetail(page, ids.cara);
  const owner = page.getByRole("complementary");
  await owner.getByLabel(leads("actions.assignLabel")).selectOption({ label: "Dani Closer" });
  await owner.getByRole("button", { name: leads("actions.assign"), exact: true }).click();
  await expect(owner.getByRole("status")).toHaveText(leads("actions.done.assign"));
  await expect(owner.getByText(leads("status.converted"), { exact: true })).toBeVisible();
  await expect(owner.getByText("Dani Closer", { exact: true }).first()).toBeVisible();
  expect((await calls(page)).rpc).toEqual([
    expect.objectContaining({
      name: "assign_lead",
      args: { p_lead_id: ids.cara, p_user_id: dani },
    }),
  ]);

  await page.goto(`/es/admin/interesados/${ids.wanda}`);
  await owner.getByText(leads("actions.discardOpen")).click();
  await owner.getByLabel(leads("actions.discardReasonLabel")).fill("Spam");
  await owner.getByRole("button", { name: leads("actions.discardSubmit") }).click();
  await expect(owner.getByText(leads("status.discarded"), { exact: true })).toBeVisible();
  await expect(owner.getByText(`${leads("actions.reasonPrefix")} Spam`)).toBeVisible();
});

test("a missing or malformed id gets the not found screen, and a closer a 404", async ({
  page,
}) => {
  await signInAdmin(page, tag);
  for (const id of ["10000000-0000-4000-8000-0000000000aa", "not-an-id"]) {
    await page.goto(`/es/admin/interesados/${id}`);
    await expect(page.getByRole("heading", { name: msg("errors.notFound.title") })).toBeVisible();
  }
  await page.context().clearCookies();
  await signInCloser(page, tag);
  const response = await page.goto(`/es/admin/interesados/${ids.cara}`);
  expect(response?.status()).toBe(404);
});

test("the add sheet validates, creates a manual lead and links to its record", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openList(page);
  const open = page.getByRole("button", { name: leads("new.open") });
  await open.click();
  const sheet = page.getByRole("dialog", { name: leads("new.title") });
  await expect(sheet).toBeVisible();
  await expectClean(page);

  await sheet.getByRole("button", { name: leads("new.submit") }).click();
  await expect(sheet.getByText(leads("new.errors.fullName"))).toBeVisible();
  await expect(sheet.getByText(leads("new.errors.reachable"))).toBeVisible();
  expect((await calls(page)).leadInserts).toHaveLength(0);

  await sheet.getByLabel(leads("new.fullName"), { exact: true }).fill("Ana Alta");
  await sheet.getByLabel(leads("new.email")).fill("ana@example.com");
  await sheet.getByLabel(leads("new.organization")).fill("Ana SL");
  await sheet.getByLabel(leads("new.message")).fill("Llamó por teléfono.");
  await sheet.getByLabel(leads("new.via"), { exact: true }).selectOption("hiring");
  await sheet.getByLabel(leads("new.assignedTo")).selectOption({ label: "Dani Closer" });
  await sheet.getByRole("button", { name: leads("new.submit") }).click();

  await expect(sheet).toBeHidden();
  const notice = page.getByRole("status").filter({ hasText: leads("new.done") });
  await expect(notice).toBeVisible();
  const { leadInserts } = await calls(page);
  expect(leadInserts).toEqual([
    {
      level: "aal2",
      body: {
        source: "manual",
        via: "hiring",
        full_name: "Ana Alta",
        email: "ana@example.com",
        phone: null,
        organization: "Ana SL",
        message: "Llamó por teléfono.",
        assigned_to: dani,
      },
    },
  ]);
  await expect(page.getByRole("link", { name: "Ana Alta" })).toBeVisible();

  await notice.getByRole("link", { name: leads("new.detail") }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ana Alta" })).toBeVisible();
  await expect(page.locator("#content").getByText("Llamó por teléfono.")).toBeVisible();
  await expect(page.locator("#content").getByText(leads("source.manual"))).toBeVisible();
});

test("the add sheet reports backend failures and closes with Escape returning focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openList(page);
  const open = page.getByRole("button", { name: leads("new.open") });
  await open.click();
  const sheet = page.getByRole("dialog", { name: leads("new.title") });
  await sheet.getByLabel(leads("new.fullName"), { exact: true }).fill("Bea Baja");
  await sheet.getByLabel(leads("new.phone")).fill("600 111 222");
  await expectClean(page);

  await page.request.post(`${mock}/__auth/lead-insert-error?tag=${tag.value}`, {
    data: { error: { code: "P0001", message: "invalid_assignee" } },
  });
  await sheet.getByRole("button", { name: leads("new.submit") }).click();
  await expect(
    sheet.getByRole("alert").filter({ hasText: leads("new.errors.assignedTo") }),
  ).toBeVisible();

  await page.request.post(`${mock}/__auth/lead-insert-error?tag=${tag.value}`, {
    data: { error: { code: "XX000", message: "internal" } },
  });
  await sheet.getByRole("button", { name: leads("new.submit") }).click();
  await expect(
    sheet.getByRole("alert").filter({ hasText: leads("new.errors.error") }),
  ).toBeVisible();
  await expect(sheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();
});

test("the add sheet is still available when there are no leads yet", async ({ page, request }) => {
  await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Finteresados");
  await request.post(`${mock}/__auth/leads-mode?tag=${tag.value}`, { data: { mode: "empty" } });
  await page.reload();
  await expect(page.getByRole("heading", { name: leads("empty.title") })).toBeVisible();
  await expect(page.getByRole("button", { name: leads("new.open") })).toBeVisible();
  await expectClean(page);
});
