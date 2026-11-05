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
  crm: {
    commissions: {
      title: string;
      leadAdmin: string;
      leadCloser: string;
      empty: { title: string; filterTitle: string };
      error: { title: string };
      totals: Record<string, string>;
      views: Record<string, string>;
      lines: { caption: string; selectAll: string; rejectedReason: string; noPayout: string };
      headers: { caption: string };
      approve: { none: string; done: string; selected: string };
      reject: {
        title: string;
        reason: string;
        submit: string;
        done: string;
        errors: Record<string, string>;
      };
    };
    contact: { money: { lineStatuses: Record<string, string> } };
  };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.crm.commissions;
const statuses = es.crm.contact.money.lineStatuses;
const { totp } = es.auth;

const page$ = "/es/crm/comisiones";

interface MoneyCall {
  kind: string;
  body?: { p_ids?: string[]; p_reason?: string };
}

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.53" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function moneyCalls(page: Page): Promise<MoneyCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as { money: MoneyCall[] }).money;
}

function pattern(target: string) {
  return new RegExp(`${target.replaceAll("?", "\\?")}$`);
}

async function asAdmin(page: Page, target = page$) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(pattern(target));
}

async function asCloser(page: Page, target = page$) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(pattern(target));
}

async function asSubcloser(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInOtp(page, tag, "dani@example.com", `?next=${encodeURIComponent(page$)}`);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(pattern(page$));
}

function rows(page: Page) {
  return page.getByRole("table", { name: text.lines.caption }).locator("tbody tr");
}

function card(page: Page, name: string) {
  return page.getByRole("link", { name: new RegExp(`^${name}`) });
}

test("the admin sees the totals by status and filters by them in the URL", async ({ page }) => {
  await asAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await expect(page.getByText(text.leadAdmin)).toBeVisible();
  await expect(rows(page)).toHaveCount(6);
  await expect(card(page, text.totals.accrued ?? "")).toContainText(/150,00/);
  await expect(card(page, text.totals.approved ?? "")).toContainText(/40,00/);
  await expect(card(page, text.totals.paid ?? "")).toContainText(/2,00/);
  await expect(card(page, text.totals.reversed ?? "")).toContainText(/-10,00/);
  await expectClean(page);

  await card(page, text.totals.accrued ?? "").click();
  await expect(page).toHaveURL(/status=accrued/);
  await expect(rows(page)).toHaveCount(3);
  await expect(card(page, text.totals.accrued ?? "")).toHaveAttribute("aria-current", "page");

  await card(page, text.totals.reversed ?? "").click();
  await expect(rows(page)).toHaveCount(1);

  await card(page, text.totals.all ?? "").click();
  await expect(rows(page)).toHaveCount(6);
});

test("the admin approves a selection of accrued lines", async ({ page }) => {
  await asAdmin(page);
  const approve = page.getByRole("button", { name: text.approve.none });
  await expect(approve).toBeDisabled();

  await page
    .getByRole("checkbox", { name: /Seleccionar la línea de Bruno Banco por 140,00/ })
    .check();
  await page
    .getByRole("checkbox", { name: /Seleccionar la línea de Carmen Cuenta por 20,00/ })
    .check();
  await expect(page.getByText(text.approve.selected.replace("{count}", "2"))).toBeVisible();
  await page.getByRole("button", { name: "Aprobar selección (2)" }).click();

  await expect(page.getByRole("status").filter({ hasText: text.approve.done })).toBeAttached();
  await expect(card(page, text.totals.approved ?? "")).toContainText(/200,00/);
  await expect(card(page, text.totals.accrued ?? "")).toContainText(/-10,00/);
  const calls = (await moneyCalls(page)).filter((call) => call.kind === "approve-lines");
  expect(calls.at(-1)?.body?.p_ids).toHaveLength(2);
});

test("selecting every accrued line works from the header and rejecting needs a reason", async ({
  page,
}) => {
  await asAdmin(page, `${page$}?status=accrued`);
  await page.getByRole("checkbox", { name: text.lines.selectAll }).check();
  await expect(page.getByText(text.approve.selected.replace("{count}", "3"))).toBeVisible();
  await page.getByRole("checkbox", { name: text.lines.selectAll }).uncheck();

  await page.getByRole("button", { name: /Rechazar la línea de Carmen Cuenta por -10,00/ }).click();
  const dialog = page.getByRole("dialog", { name: text.reject.title });
  await expectClean(page);
  await dialog.getByRole("button", { name: text.reject.submit }).click();
  await expect(dialog.getByText(text.reject.errors.reason_required ?? "")).toBeVisible();
  await dialog.getByLabel(text.reject.reason).fill("Devolución duplicada");
  await dialog.getByRole("button", { name: text.reject.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.reject.done })).toBeAttached();
  await expect(rows(page)).toHaveCount(2);
  await card(page, text.totals.all ?? "").click();
  await expect(
    page.getByText(text.lines.rejectedReason.replace("{reason}", "Devolución duplicada")),
  ).toBeVisible();
  const rejects = (await moneyCalls(page)).filter((call) => call.kind === "reject-line");
  expect(rejects.at(-1)?.body?.p_reason).toBe("Devolución duplicada");
});

test("a closer reads her lines and her subcloser's, with no approval controls", async ({
  page,
}) => {
  await asCloser(page);
  await expect(page.getByText(text.leadCloser)).toBeVisible();
  await expect(rows(page)).toHaveCount(6);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Rechazar/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: text.approve.none })).toHaveCount(0);
  await expect(page.getByText(statuses.paid ?? "", { exact: true })).toBeVisible();
  await expectClean(page);
});

test("a subcloser only reads her own lines", async ({ page }) => {
  await asSubcloser(page);
  await expect(rows(page)).toHaveCount(3);
  await expect(card(page, text.totals.accrued ?? "")).toContainText(/0,00/);
  await expect(card(page, text.totals.approved ?? "")).toContainText(/40,00/);
});

test("the headers view shows the frozen rates and what is expected and accrued", async ({
  page,
}) => {
  await asAdmin(page, `${page$}?view=headers`);
  const table = page.getByRole("table", { name: text.headers.caption });
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(table).toContainText("Bruno Banco");
  await expect(table).toContainText("Carmen Cuenta");
  await expect(table).toContainText(/280,00/);
  await expect(table).toContainText(/120,00/);
  await expect(table).toContainText(/52,00/);
  await expectClean(page);
});

test("the lines fit a phone and pass axe", async ({ page }) => {
  await asAdmin(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(rows(page)).toHaveCount(6);
  const spill = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(spill).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("an empty portfolio explains itself", async ({ page, request }) => {
  await request.post(`${mock}/__auth/money-mode?tag=${tag.value}`, { data: { mode: "empty" } });
  await asCloser(page);
  await expect(page.getByText(text.empty.title)).toBeVisible();
  await expectClean(page);
});

test("a failing query shows a retryable error", async ({ page, request }) => {
  await request.post(`${mock}/__auth/money-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await asAdmin(page);
  await expect(page.getByText(text.error.title)).toBeVisible();
  await expectClean(page);
});
