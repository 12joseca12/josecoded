import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import {
  mockOrigin as mock,
  signInAdmin,
  signInCloser,
  signInOtp,
  type Tag,
  totpCode,
  withTag,
} from "./support/staff";

interface Messages {
  auth: { totp: { enrollStart: string; codeLabel: string; verify: string } };
  crm: { contacts: ContactsMessages };
}

interface ContactsMessages {
  title: string;
  region: string;
  listLabel: string;
  stages: Record<string, string>;
  kinds: Record<string, string>;
  overdue: string;
  noOwner: string;
  noNextAction: string;
  never: string;
  callAria: string;
  whatsappAria: string;
  columns: { owner: string };
  empty: { title: string };
  emptyFiltered: { title: string };
  error: { title: string; retry: string };
  filters: {
    region: string;
    search: string;
    kind: string;
    stage: string;
    owner: string;
    all: string;
    due: string;
    apply: string;
    clear: string;
    noOwner: string;
  };
  new: {
    open: string;
    title: string;
    fullName: string;
    email: string;
    kind: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
  stageSheet: {
    title: string;
    reasonLabel: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
}

interface CrmCall {
  kind: string;
  body?: Record<string, unknown>;
  query?: string;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const { contacts: text } = es.crm;
const { totp } = es.auth;

const cleoId = "00000000-0000-4000-8000-0000000000c1";
const adminId = "00000000-0000-4000-8000-0000000000a2";
const path = "/es/crm/contactos";
const next = "?next=%2Fes%2Fcrm%2Fcontactos";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.31" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function crmCalls(page: Page): Promise<CrmCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as { crm: CrmCall[] }).crm;
}

async function signInSubcloser(page: Page) {
  await signInOtp(page, tag, "dani@example.com", next);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/crm\/contactos$/);
}

function filterBar(page: Page) {
  return page.getByRole("search", { name: text.filters.region });
}

function tableRow(page: Page, name: string) {
  return page.getByRole("table").getByRole("row").filter({ hasText: name });
}

async function names(page: Page): Promise<string[]> {
  const cells = page.getByRole("table").locator("tbody th a");
  return cells.allTextContents();
}

async function expectNames(page: Page, expected: string[]) {
  await expect.poll(() => names(page)).toEqual(expected);
}

async function openAsAdmin(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/contactos$/);
  await expect(page.getByRole("table")).toBeVisible();
}

async function openAsCloser(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/contactos$/);
  await expect(page.getByRole("table")).toBeVisible();
}

test("the admin sees every contact with owner, stage and overdue steps and passes axe", async ({
  page,
}) => {
  await openAsAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await expectNames(page, [
    "Carmen Cuenta",
    "Ada Arquitecta",
    "Bruno Banco",
    "Eva Evento",
    "Dario Directo",
  ]);
  const ada = tableRow(page, "Ada Arquitecta");
  await expect(ada).toContainText(text.stages.proposal ?? "");
  await expect(ada).toContainText("Enviar presupuesto");
  await expect(ada).toContainText(text.overdue);
  await expect(ada).toContainText("Cleo Closer");
  await expect(tableRow(page, "Eva Evento")).not.toContainText(text.overdue);
  await expect(tableRow(page, "Bruno Banco")).toContainText(text.stages.won ?? "");
  await expect(tableRow(page, "Dario Directo")).toContainText(text.noOwner);
  await expect(page.getByRole("columnheader", { name: text.columns.owner })).toBeVisible();
  await expectClean(page);
});

test("a closer sees her own and her subcloser's contacts but not the ownerless one", async ({
  page,
}) => {
  await openAsCloser(page);
  await expectNames(page, ["Carmen Cuenta", "Ada Arquitecta", "Bruno Banco", "Eva Evento"]);
  await expect(page.getByRole("columnheader", { name: text.columns.owner })).toBeVisible();
  await expect(tableRow(page, "Carmen Cuenta")).toContainText("Dani Closer");
  const owner = filterBar(page).getByLabel(text.filters.owner, { exact: true });
  await expect(owner.getByRole("option")).toHaveText([
    text.filters.all,
    "Cleo Closer",
    "Dani Closer",
  ]);
  await expectClean(page);
});

test("a subcloser sees only her own contacts and no owner controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInSubcloser(page);
  await expectNames(page, ["Carmen Cuenta"]);
  await expect(page.getByRole("columnheader", { name: text.columns.owner })).toHaveCount(0);
  await expect(filterBar(page).getByLabel(text.filters.owner, { exact: true })).toHaveCount(0);
});

test("filters live in the URL and narrow the list", async ({ page }) => {
  await openAsAdmin(page);
  await filterBar(page).getByLabel(text.filters.kind, { exact: true }).selectOption("client");
  await page.getByRole("button", { name: text.filters.apply }).click();
  await expect(page).toHaveURL(/[?&]kind=client/);
  await expectNames(page, ["Bruno Banco"]);

  await page.goto(`${path}?stage=proposal`);
  await expectNames(page, ["Ada Arquitecta"]);
  await expect(filterBar(page).getByLabel(text.filters.stage, { exact: true })).toHaveValue(
    "proposal",
  );

  await page.goto(`${path}?due=1`);
  await expectNames(page, ["Ada Arquitecta"]);
  await expect(filterBar(page).getByLabel(text.filters.due, { exact: true })).toBeChecked();

  await page.goto(`${path}?q=cuenta`);
  await expectNames(page, ["Carmen Cuenta"]);

  await page.goto(`${path}?owner=none`);
  await expectNames(page, ["Dario Directo"]);

  await page.goto(`${path}?owner=${cleoId}&kind=partner`);
  await expectNames(page, ["Eva Evento"]);

  const queries = (await crmCalls(page)).map((call) => call.query ?? "");
  expect(queries.some((query) => decodeURIComponent(query).includes("deals!inner"))).toBe(true);
  await expectClean(page);
});

test("a filter with no matches explains it and offers to clear the filters", async ({ page }) => {
  await openAsAdmin(page);
  await page.goto(`${path}?q=zzz-sin-resultados`);
  await expect(page.getByRole("heading", { name: text.emptyFiltered.title })).toBeVisible();
  await page.getByRole("link", { name: text.filters.clear }).click();
  await expect(page).toHaveURL(/\/es\/crm\/contactos$/);
  await expect(page.getByRole("table")).toBeVisible();
});

test("on a phone the list turns into cards with call and WhatsApp", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/contactos$/);
  const cards = page.getByRole("list", { name: text.listLabel });
  await expect(cards).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
  const ada = cards.getByRole("listitem").filter({ hasText: "Ada Arquitecta" });
  await expect(
    ada.getByRole("link", { name: text.callAria.replace("{name}", "Ada Arquitecta") }),
  ).toHaveAttribute("href", "tel:+34600111222");
  await expect(ada.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    "https://wa.me/34600111222",
  );
  const carmen = cards.getByRole("listitem").filter({ hasText: "Carmen Cuenta" });
  await expect(carmen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    "https://wa.me/442079460958",
  );
  const eva = cards.getByRole("listitem").filter({ hasText: "Eva Evento" });
  await expect(eva.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
  await expect(eva.getByRole("link", { name: /Llamar/ })).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("a closer creates a contact for herself", async ({ page }) => {
  await openAsCloser(page);
  const trigger = page.getByRole("button", { name: text.new.open });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: text.new.title });
  await expect(dialog).toBeVisible();
  await expectClean(page);

  await dialog.getByRole("button", { name: text.new.submit }).click();
  await expect(dialog.getByText(text.new.errors.fullName ?? "")).toBeVisible();
  await expect(dialog.getByLabel(text.new.fullName)).toBeFocused();

  await dialog.getByLabel(text.new.fullName).fill("Gloria Gestión");
  await dialog.getByLabel(text.new.email).fill("ada@estudioada.example");
  await dialog.getByRole("button", { name: text.new.submit }).click();
  await expect(dialog.getByText(text.new.errors.duplicate ?? "")).toBeVisible();

  await dialog.getByLabel(text.new.email).fill("gloria@gestion.example");
  await dialog.getByRole("button", { name: text.new.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.new.done })).toBeVisible();
  await expect(tableRow(page, "Gloria Gestión")).toBeVisible();
  await expect(trigger).toBeFocused();
  const inserts = (await crmCalls(page)).filter((call) => call.kind === "insert-contact");
  expect(inserts.at(-1)?.body).toMatchObject({
    owner_id: cleoId,
    full_name: "Gloria Gestión",
    email: "gloria@gestion.example",
    kind: "prospect",
  });
});

test("the admin creates a contact owned by herself and Escape closes the sheet", async ({
  page,
}) => {
  await openAsAdmin(page);
  const trigger = page.getByRole("button", { name: text.new.open });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: text.new.title });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByLabel(text.new.fullName).fill("Hugo Horizonte");
  await dialog.getByLabel(text.new.kind).selectOption("client");
  await dialog.getByRole("button", { name: text.new.submit }).click();
  await expect(tableRow(page, "Hugo Horizonte")).toContainText(text.kinds.client ?? "");
  const inserts = (await crmCalls(page)).filter((call) => call.kind === "insert-contact");
  expect(inserts.at(-1)?.body).toMatchObject({ owner_id: adminId, kind: "client" });
});

test("a closer moves a deal to another stage from the list", async ({ page }) => {
  await openAsCloser(page);
  const ada = tableRow(page, "Ada Arquitecta");
  await ada.getByRole("button", { name: /Ada Arquitecta/ }).click();
  const dialog = page.getByRole("dialog", { name: text.stageSheet.title });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: text.stages.won ?? "" })).toHaveCount(0);
  await expect(dialog.getByRole("radio", { name: text.stages.proposal ?? "" })).toBeChecked();
  await expectClean(page);

  await dialog.getByRole("radio", { name: text.stages.meeting ?? "" }).check();
  await dialog.getByRole("button", { name: text.stageSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(ada).toContainText(text.stages.meeting ?? "");
  const patches = (await crmCalls(page)).filter((call) => call.kind === "patch-deal");
  expect(patches.at(-1)?.body).toEqual({ stage: "meeting", lost_reason: null });
});

test("losing a deal needs a reason and the sheet reports a forbidden change", async ({
  page,
  request,
}) => {
  await openAsCloser(page);
  const ada = tableRow(page, "Ada Arquitecta");
  await ada.getByRole("button", { name: /Ada Arquitecta/ }).click();
  const dialog = page.getByRole("dialog", { name: text.stageSheet.title });
  await dialog.getByRole("radio", { name: text.stages.lost ?? "" }).check();
  await dialog.getByRole("button", { name: text.stageSheet.submit }).click();
  await expect(dialog.getByText(text.stageSheet.errors.reason ?? "")).toBeVisible();
  expect((await crmCalls(page)).filter((call) => call.kind === "patch-deal")).toHaveLength(0);

  await request.post(`${mock}/__auth/crm-write-error?tag=${tag.value}`, {
    data: { error: { code: "42501", message: "forbidden" } },
  });
  await dialog.getByLabel(text.stageSheet.reasonLabel).fill("Precio");
  await dialog.getByRole("button", { name: text.stageSheet.submit }).click();
  await expect(
    dialog.getByRole("alert").filter({ hasText: text.stageSheet.errors.forbidden ?? "" }),
  ).toBeVisible();

  await request.post(`${mock}/__auth/crm-write-error?tag=${tag.value}`, {
    data: { error: null },
  });
  await dialog.getByRole("button", { name: text.stageSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(ada).toContainText(text.stages.lost ?? "");
  await expect(ada.getByRole("button")).toHaveCount(0);
});

test("the list has empty and error states", async ({ page, request }) => {
  await openAsAdmin(page);
  await request.post(`${mock}/__auth/crm-mode?tag=${tag.value}`, { data: { mode: "empty" } });
  await page.reload();
  await expect(page.getByRole("heading", { name: text.empty.title })).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/crm-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: text.error.title })).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/crm-mode?tag=${tag.value}`, { data: { mode: "data" } });
  await page.getByRole("button", { name: text.error.retry }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("the contacts entry is in the closer navigation and marks the current page", async ({
  page,
}) => {
  await openAsCloser(page);
  const rail = page.getByRole("navigation", { name: "CRM" });
  await expect(rail.getByRole("link", { name: "Contactos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
