import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
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
  crm: { contacts: Contacts; contact: Contact };
  errors: { notFound: { title: string } };
}

interface Contacts {
  stages: Record<string, string>;
  stageSheet: {
    title: string;
    reasonLabel: string;
    submit: string;
    errors: Record<string, string>;
  };
  callAria: string;
  whatsappAria: string;
}

interface Contact {
  back: string;
  head: { owner: string; overdue: string; copyAria: string; notes: string; tags: string };
  reassign: {
    open: string;
    title: string;
    owner: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
  deals: { lose: string; reopen: string; wonAmount: string; lostReason: string };
  activity: {
    listLabel: string;
    unknownAuthor: string;
    system: string;
    kinds: Record<string, string>;
  };
  composer: {
    title: string;
    kind: string;
    deal: string;
    body: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
}

interface CrmCall {
  kind: string;
  body?: Record<string, unknown>;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const { contacts, contact: text } = es.crm;
const { totp } = es.auth;

const cleoId = "00000000-0000-4000-8000-0000000000c1";
const daniId = "00000000-0000-4000-8000-0000000000c2";
const ada = "/es/crm/contactos/20000000-0000-4000-8000-0000000000a1";
const bruno = "/es/crm/contactos/20000000-0000-4000-8000-0000000000a2";
const carmen = "/es/crm/contactos/20000000-0000-4000-8000-0000000000b1";
const dario = "/es/crm/contactos/20000000-0000-4000-8000-0000000000c1";
const adaDeal = "30000000-0000-4000-8000-0000000000a1";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.32" } });

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

async function asAdmin(page: Page, target: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(new RegExp(`${target}$`));
}

async function asCloser(page: Page, target: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(new RegExp(`${target}$`));
}

async function expectNotFound(page: Page, target: string) {
  await page.goto(target);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Ada Arquitecta" })).toHaveCount(0);
}

function card(page: Page) {
  return page.locator("article");
}

function timeline(page: Page) {
  return page.getByRole("list", { name: text.activity.listLabel }).getByRole("listitem");
}

test("the admin sees the whole contact record and passes axe", async ({ page }) => {
  await asAdmin(page, ada);
  await expect(page.getByRole("heading", { level: 1, name: "Ada Arquitecta" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ada@estudioada.example" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: text.head.copyAria.replace("{name}", "Ada Arquitecta") }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: contacts.callAria.replace("{name}", "Ada Arquitecta") }),
  ).toHaveAttribute("href", "tel:+34600111222");
  await expect(page.locator('[data-field="owner"]')).toHaveText("Cleo Closer");
  await expect(page.getByText("Enviar presupuesto")).toBeVisible();
  await expect(page.getByText(text.head.overdue)).toBeVisible();
  await expect(page.getByText("Prefiere que la llamen por la tarde.")).toBeVisible();
  await expect(page.getByRole("list", { name: text.head.tags })).toContainText("arquitectura");
  await expect(
    card(page)
      .getByText(contacts.stages.proposal ?? "", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: text.reassign.open })).toBeVisible();

  const items = timeline(page);
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText(text.activity.kinds.call ?? "");
  await expect(items.nth(0)).toContainText("Cleo Closer");
  await expect(items.nth(1)).toContainText("Jose Enrolled");
  await expect(items.nth(2)).toContainText(text.activity.system);
  await expectClean(page);
});

test("a closer sees the contact without the reassign control and hides unknown authors", async ({
  page,
}) => {
  await asCloser(page, ada);
  await expect(page.getByRole("heading", { level: 1, name: "Ada Arquitecta" })).toBeVisible();
  await expect(page.getByRole("button", { name: text.reassign.open })).toHaveCount(0);
  await expect(timeline(page).nth(1)).toContainText(text.activity.unknownAuthor);
  await expectClean(page);
  await page.goto(carmen);
  await expect(page.getByRole("heading", { level: 1, name: "Carmen Cuenta" })).toBeVisible();
});

test("visibility follows the portfolio: foreign, ownerless and malformed ids are 404", async ({
  page,
}) => {
  await asCloser(page, ada);
  await expectNotFound(page, dario);
  await expectNotFound(page, "/es/crm/contactos/20000000-0000-4000-8000-0000000000ff");
  await expectNotFound(page, "/es/crm/contactos/not-a-uuid");
});

test("a subcloser cannot open her parent closer's contact", async ({ page }) => {
  await signInOtp(page, tag, "dani@example.com", `?next=${encodeURIComponent(carmen)}`);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Carmen Cuenta" })).toBeVisible();
  await expectNotFound(page, ada);
});

test("a closer logs an activity linked to a deal", async ({ page }) => {
  await asCloser(page, ada);
  await page.getByRole("button", { name: text.composer.submit }).click();
  await expect(page.getByText(text.composer.errors.body ?? "")).toBeVisible();
  await expect(page.getByLabel(text.composer.body)).toBeFocused();

  await page.getByLabel(text.composer.kind, { exact: true }).selectOption("meeting");
  await page.getByLabel(text.composer.deal, { exact: true }).selectOption(adaDeal);
  await page.getByLabel(text.composer.body).fill("Reunión en su estudio.");
  await page.getByRole("button", { name: text.composer.submit }).click();
  await expect(page.getByRole("status").filter({ hasText: text.composer.done })).toBeVisible();
  const items = timeline(page);
  await expect(items).toHaveCount(4);
  await expect(items.first()).toContainText("Reunión en su estudio.");
  await expect(items.first()).toContainText("Cleo Closer");
  const inserts = (await crmCalls(page)).filter((call) => call.kind === "insert-activity");
  expect(inserts.at(-1)?.body).toMatchObject({
    author_id: cleoId,
    deal_id: adaDeal,
    kind: "meeting",
  });
});

test("the deal card changes stage, loses with a reason and reopens", async ({ page }) => {
  await asCloser(page, ada);
  await page.getByRole("button", { name: contacts.stageSheet.title }).click();
  const dialog = page.getByRole("dialog", { name: contacts.stageSheet.title });
  await dialog.getByRole("radio", { name: contacts.stages.meeting ?? "" }).check();
  await dialog.getByRole("button", { name: contacts.stageSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(
    card(page)
      .getByText(contacts.stages.meeting ?? "", { exact: true })
      .first(),
  ).toBeVisible();

  await page.getByRole("button", { name: text.deals.lose }).click();
  await expect(dialog.getByRole("radio", { name: contacts.stages.lost ?? "" })).toBeChecked();
  await dialog.getByRole("button", { name: contacts.stageSheet.submit }).click();
  await expect(dialog.getByText(contacts.stageSheet.errors.reason ?? "")).toBeVisible();
  await dialog.getByLabel(contacts.stageSheet.reasonLabel).fill("Presupuesto ajustado");
  await dialog.getByRole("button", { name: contacts.stageSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(card(page).getByText("Presupuesto ajustado")).toBeVisible();
  await expect(page.getByRole("button", { name: text.deals.lose })).toHaveCount(0);

  await page.getByRole("button", { name: text.deals.reopen }).click();
  await dialog.getByRole("button", { name: contacts.stageSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(
    card(page)
      .getByText(contacts.stages.new ?? "", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(card(page).getByText("Presupuesto ajustado")).toHaveCount(0);
});

test("a won deal shows what was won and offers no stage changes", async ({ page }) => {
  await asCloser(page, bruno);
  await expect(card(page).getByText(text.deals.wonAmount)).toBeVisible();
  await expect(
    card(page)
      .getByText(contacts.stages.won ?? "", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: contacts.stageSheet.title })).toHaveCount(0);
  await expect(page.getByRole("button", { name: text.deals.lose })).toHaveCount(0);
});

test("the admin reassigns the contact and its open deals", async ({ page }) => {
  await asAdmin(page, ada);
  const trigger = page.getByRole("button", { name: text.reassign.open });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: text.reassign.title });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByLabel(text.reassign.owner).getByRole("option", { name: "Cleo Closer" }),
  ).toBeDisabled();
  await expectClean(page);

  await dialog.getByRole("button", { name: text.reassign.submit }).click();
  await expect(dialog.getByText(text.reassign.errors.owner ?? "")).toBeVisible();

  await dialog.getByLabel(text.reassign.owner).selectOption({ label: "Dani Closer" });
  await dialog.getByRole("button", { name: text.reassign.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-field="owner"]')).toHaveText("Dani Closer");
  const calls = await crmCalls(page);
  expect(calls.find((call) => call.kind === "patch-contact")?.body).toEqual({ owner_id: daniId });
  expect(calls.some((call) => call.kind === "patch-deals-owner")).toBe(true);
});

test("on a phone the record stacks without horizontal scroll and passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(ada)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Ada Arquitecta" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("the contact shows an error state with retry", async ({ page, request }) => {
  await asCloser(page, ada);
  await request.post(`${mock}/__auth/crm-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "No se ha podido cargar" })).toBeVisible();
  await request.post(`${mock}/__auth/crm-mode?tag=${tag.value}`, { data: { mode: "data" } });
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ada Arquitecta" })).toBeVisible();
});
