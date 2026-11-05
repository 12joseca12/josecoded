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
  crm: { contact: Contact };
}

interface Contact {
  deals: { recurringMonthly: string; recurringCancelled: string; wonAmount: string };
  win: {
    open: string;
    openAria: string;
    title: string;
    wonAmount: string;
    recurring: string;
    previewTitle: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
    noCommission: Record<string, string>;
  };
  cancelRecurring: {
    open: string;
    openAria: string;
    title: string;
    submit: string;
    done: string;
  };
  money: {
    title: string;
    expected: string;
    scheduleTitle: string;
    paymentsTitle: string;
    linesTitle: string;
    invoicesTitle: string;
    overdue: string;
    error: { title: string };
    paymentMethods: Record<string, string>;
    invoiceKinds: Record<string, string>;
  };
}

interface MoneyCall {
  kind: string;
  body?: Record<string, unknown>;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const { totp } = es.auth;
const text = es.crm.contact;

const ada = "/es/crm/contactos/20000000-0000-4000-8000-0000000000a1";
const bruno = "/es/crm/contactos/20000000-0000-4000-8000-0000000000a2";
const carmen = "/es/crm/contactos/20000000-0000-4000-8000-0000000000b1";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.41" } });

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

async function asSubcloser(page: Page, target: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInOtp(page, tag, "dani@example.com", `?next=${encodeURIComponent(target)}`);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
}

function winButton(page: Page, name: string) {
  return page.getByRole("button", { name: text.win.openAria.replace("{name}", name) });
}

function moneySection(page: Page) {
  return page.locator("section[aria-labelledby='money-title']");
}

test("a closer sees the expected commission while typing and wins the deal", async ({ page }) => {
  await asCloser(page, ada);
  await winButton(page, "Ada Arquitecta").click();
  const dialog = page.getByRole("dialog", { name: text.win.title });
  await expect(dialog).toBeVisible();
  await expectClean(page);

  await dialog.getByRole("button", { name: text.win.submit }).click();
  await expect(dialog.getByText(text.win.errors.wonAmount ?? "")).toBeVisible();

  await dialog.getByLabel(text.win.wonAmount).fill("2400");
  await expect(dialog.getByText(/Cleo Closer \(quien cierra\):\s10\s%\s=\s240,00/)).toBeVisible();
  await dialog.getByLabel(text.win.recurring).fill("60");
  await expect(dialog.getByText(/Recurrente:\s5\s%\s=\s3,00/)).toBeVisible();
  await expect(dialog.getByText(/Total previsto:\s240,00/)).toBeVisible();

  await dialog.getByRole("button", { name: text.win.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.win.done })).toBeAttached();
  await expect(page.locator("article").getByText(text.deals.wonAmount)).toBeVisible();
  await expect(page.locator("article").getByText(text.deals.recurringMonthly)).toBeVisible();
  await expect(winButton(page, "Ada Arquitecta")).toHaveCount(0);
  await expect(moneySection(page)).toContainText(/Cleo Closer ·\s10\s%\s=\s240,00/);

  const wins = (await moneyCalls(page)).filter((call) => call.kind === "win-deal");
  expect(wins.at(-1)?.body).toMatchObject({
    p_won_amount: 2400,
    p_recurring_monthly: 60,
  });
  await expectClean(page);
});

test("a subcloser sees the parent share and an amount typed with Spanish separators", async ({
  page,
}) => {
  await asSubcloser(page, carmen);
  await winButton(page, "Carmen Cuenta").click();
  const dialog = page.getByRole("dialog", { name: text.win.title });
  await dialog.getByLabel(text.win.wonAmount).fill("1.000,50");
  await expect(dialog.getByText(/Dani Closer \(quien cierra\):\s10\s%\s=\s100,05/)).toBeVisible();
  await expect(dialog.getByText(/Closer padre:\s5\s%\s=\s50,03/)).toBeVisible();
  await dialog.getByRole("button", { name: text.win.submit }).click();
  await expect(dialog).toBeHidden();
  const wins = (await moneyCalls(page)).filter((call) => call.kind === "win-deal");
  expect(wins.at(-1)?.body).toMatchObject({ p_won_amount: 1000.5 });
});

test("an invalid recurring amount is reported on its field and nothing is sent", async ({
  page,
}) => {
  await asCloser(page, ada);
  await winButton(page, "Ada Arquitecta").click();
  const dialog = page.getByRole("dialog", { name: text.win.title });
  await dialog.getByLabel(text.win.wonAmount).fill("500");
  await dialog.getByLabel(text.win.recurring).fill("abc");
  await dialog.getByRole("button", { name: text.win.submit }).click();
  await expect(dialog.getByText(text.win.errors.recurringMonthly ?? "")).toBeVisible();
  expect((await moneyCalls(page)).filter((call) => call.kind === "win-deal")).toHaveLength(0);
});

test("the admin sees the full money record and cancels the recurring charge", async ({ page }) => {
  await asAdmin(page, bruno);
  const section = moneySection(page);
  await expect(section).toContainText(text.money.scheduleTitle);
  await expect(section).toContainText(text.money.overdue);
  await expect(section).toContainText(text.money.paymentMethods.transfer ?? "");
  await expect(section).toContainText("PF-2026-001");
  await expect(section).toContainText(text.money.invoiceKinds.proforma ?? "");
  await expect(section).toContainText("Cleo Closer");
  await expectClean(page);

  await page
    .getByRole("button", { name: text.cancelRecurring.openAria.replace("{name}", "Bruno Banco") })
    .click();
  const dialog = page.getByRole("dialog", { name: text.cancelRecurring.title });
  await expectClean(page);
  await dialog.getByRole("button", { name: text.cancelRecurring.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("article").getByText(text.deals.recurringCancelled)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: text.cancelRecurring.openAria.replace("{name}", "Bruno Banco"),
    }),
  ).toHaveCount(0);
});

test("a closer sees amounts and lines but neither invoices, method nor the cancel control", async ({
  page,
}) => {
  await asCloser(page, bruno);
  const section = moneySection(page);
  await expect(section).toContainText(text.money.paymentsTitle);
  await expect(section).toContainText(text.money.linesTitle);
  await expect(section).not.toContainText(text.money.invoicesTitle);
  await expect(section).not.toContainText("PF-2026-001");
  await expect(section).not.toContainText(text.money.paymentMethods.transfer ?? "");
  await expect(
    page.getByRole("button", {
      name: text.cancelRecurring.openAria.replace("{name}", "Bruno Banco"),
    }),
  ).toHaveCount(0);
  await expectClean(page);
});

test("the money section fits a phone and passes axe", async ({ page }) => {
  await asAdmin(page, bruno);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(moneySection(page)).toContainText(text.money.scheduleTitle);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("a failing money query shows a retryable error and keeps the deal card", async ({
  page,
  request,
}) => {
  await request.post(`${mock}/__auth/money-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await asCloser(page, bruno);
  await expect(page.getByText(text.money.error.title)).toBeVisible();
  await expect(page.locator("article").getByText(text.deals.wonAmount)).toBeVisible();
  await expectClean(page);
});
