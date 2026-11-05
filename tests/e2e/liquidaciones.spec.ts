import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Payouts {
  title: string;
  tabs: Record<string, string>;
  error: { title: string };
  empty: { tabTitle: string };
  builder: {
    open: string;
    title: string;
    beneficiary: string;
    start: string;
    end: string;
    withholding: string;
    submit: string;
    done: string;
    previewEmpty: string;
    errors: Record<string, string>;
  };
  detail: { heading: string; back: string };
  actions: { issue: string; issueDone: string; markPaid: string; deleteDraft: string };
  pay: {
    title: string;
    date: string;
    reference: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
  deleteConfirm: { title: string; submit: string; done: string };
  invoice: {
    none: string;
    open: string;
    upload: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
  statement: { title: string; print: string; notPayment: string };
  statuses: Record<string, string>;
  list: { open: string };
}

interface Messages {
  errors: { notFound: { title: string } };
  admin: { payouts: Payouts };
}

interface StorageCall {
  kind: string;
  path?: string;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.admin.payouts;

const list = "/es/admin/liquidaciones";
const seeded = "/es/admin/liquidaciones/73000000-0000-4000-8000-000000000001";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.54" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function pattern(target: string) {
  return new RegExp(`${target.replaceAll("?", "\\?")}$`);
}

async function asAdmin(page: Page, target = list) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(pattern(target));
}

function tab(page: Page, id: string) {
  return page.getByRole("link", { name: new RegExp(`^${text.tabs[id] ?? ""} \\(`) });
}

async function createDraft(page: Page, withholding = "0") {
  await page.getByRole("button", { name: text.builder.open }).click();
  const dialog = page.getByRole("dialog", { name: text.builder.title });
  await dialog.getByLabel(text.builder.beneficiary).selectOption({ label: "Dani Closer" });
  await dialog.getByLabel(text.builder.start).fill("2026-10-01");
  await dialog.getByLabel(text.builder.end).fill("2026-10-31");
  await dialog.getByLabel(text.builder.withholding).fill(withholding);
  await expect(dialog.getByText(/1 líneas/)).toBeVisible();
  await dialog.getByRole("button", { name: text.builder.submit }).click();
  await expect(dialog).toBeHidden();
}

test("the admin sees the payouts with tabs and counts, and passes axe", async ({ page }) => {
  await asAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await expect(tab(page, "all")).toHaveAttribute("aria-current", "page");
  await expect(tab(page, "all")).toContainText("(1)");
  await expect(tab(page, "paid")).toContainText("(1)");
  await expect(tab(page, "draft")).toContainText("(0)");
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "Dani Closer" }) });
  await expect(row).toContainText(text.statuses.paid ?? "");
  await expect(row).toContainText("Prueba: transferencia");
  await expectClean(page);

  await tab(page, "draft").click();
  await expect(page.getByText(text.empty.tabTitle)).toBeVisible();

  await page.setViewportSize({ width: 375, height: 800 });
  const spill = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(spill).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("the detail shows the statement, its lines and the totals", async ({ page }) => {
  await asAdmin(page);
  await page.getByRole("link", { name: /Abrir la liquidación de Dani Closer/ }).click();
  await expect(page).toHaveURL(pattern(seeded));
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: text.detail.heading.replace("{name}", "Dani Closer"),
    }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toContainText(text.statement.notPayment);
  await expect(page.getByRole("row").filter({ hasText: "Carmen Cuenta" })).toContainText("2,00");
  await expect(page.getByText(text.invoice.none)).toBeVisible();
  await expect(page.getByRole("button", { name: text.actions.markPaid })).toHaveCount(0);
  await expectClean(page);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: text.statement.print })).toBeHidden();
  await expect(page.getByRole("link", { name: text.detail.back })).toBeHidden();
  await expect(page.getByRole("heading", { name: text.statement.title })).toBeVisible();
});

test("a draft is built from the approved lines of a period, issued and marked as paid", async ({
  page,
}) => {
  await asAdmin(page);
  await createDraft(page, "15");
  await expect(page.getByRole("status").filter({ hasText: text.builder.done })).toBeAttached();
  await expect(tab(page, "draft")).toContainText("(1)");
  await tab(page, "draft").click();
  await expect(page).toHaveURL(/tab=draft/);
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "Dani Closer" }) });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("34,00");
  await row.getByRole("link", { name: text.list.open }).click();

  await expect(page.getByRole("button", { name: text.actions.markPaid })).toHaveCount(0);
  await page.getByRole("button", { name: text.actions.issue }).click();
  await expect(page.getByRole("status").filter({ hasText: text.actions.issueDone })).toBeAttached();
  await expect(page.getByText(text.statuses.issued ?? "", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: text.actions.markPaid }).click();
  const dialog = page.getByRole("dialog", { name: text.pay.title });
  await expect(dialog).toContainText(/34,00/);
  await expectClean(page);
  await dialog.getByRole("button", { name: text.pay.submit }).click();
  await expect(dialog.getByText(text.pay.errors.reference ?? "")).toBeVisible();
  await dialog.getByLabel(text.pay.reference).fill("TRF-2026-11");
  await dialog.getByRole("button", { name: text.pay.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.pay.done })).toBeAttached();
  await expect(page.getByText("TRF-2026-11")).toBeVisible();
  await expect(page.getByRole("button", { name: text.actions.markPaid })).toHaveCount(0);
});

test("a draft can be deleted after a confirmation", async ({ page }) => {
  await asAdmin(page);
  await createDraft(page);
  await tab(page, "draft").click();
  await expect(page).toHaveURL(/tab=draft/);
  await page.getByRole("link", { name: /Abrir la liquidación de Dani Closer/ }).click();
  await page.getByRole("button", { name: text.actions.deleteDraft }).click();
  const dialog = page.getByRole("dialog", { name: text.deleteConfirm.title });
  await dialog.getByRole("button", { name: text.deleteConfirm.submit }).click();
  await expect(page).toHaveURL(pattern(list));
  await expect(tab(page, "draft")).toContainText("(0)");
});

test("the builder reports an empty period, a missing closer and a bad withholding", async ({
  page,
}) => {
  await asAdmin(page);
  await page.getByRole("button", { name: text.builder.open }).click();
  const dialog = page.getByRole("dialog", { name: text.builder.title });
  await dialog.getByRole("button", { name: text.builder.submit }).click();
  await expect(dialog.getByText(text.builder.errors.beneficiary ?? "")).toBeVisible();

  await dialog.getByLabel(text.builder.beneficiary).selectOption({ label: "Cleo Closer" });
  await dialog.getByLabel(text.builder.start).fill("2026-10-01");
  await dialog.getByLabel(text.builder.end).fill("2026-10-31");
  await expect(dialog.getByText(text.builder.previewEmpty)).toBeVisible();
  await dialog.getByRole("button", { name: text.builder.submit }).click();
  await expect(dialog.getByText(text.builder.errors.no_lines_in_period ?? "")).toBeVisible();

  await dialog.getByLabel(text.builder.withholding).fill("150");
  await dialog.getByRole("button", { name: text.builder.submit }).click();
  await expect(dialog.getByText(text.builder.errors.withholding ?? "")).toBeVisible();
  await expectClean(page);
});

test("the closer invoice is uploaded as a PDF and opens through a signed link", async ({
  page,
}) => {
  await asAdmin(page, seeded);
  const input = page.getByLabel(text.invoice.upload);
  await input.setInputFiles({
    name: "factura.pdf",
    mimeType: "text/plain",
    buffer: Buffer.from("no soy un pdf"),
  });
  await page.getByRole("button", { name: text.invoice.submit, exact: true }).click();
  await expect(page.getByText(text.invoice.errors.fileType ?? "")).toBeVisible();

  await input.setInputFiles({
    name: "factura.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%closer\n"),
  });
  await page.getByRole("button", { name: text.invoice.submit, exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: text.invoice.done })).toBeAttached();
  const link = page.getByRole("link", { name: text.invoice.open });
  await expect(link).toHaveAttribute("target", "_blank");
  const opened = await page.request.get((await link.getAttribute("href")) ?? "");
  expect(opened.status()).toBe(200);
  expect(opened.headers()["content-type"]).toContain("application/pdf");
  const calls = (await (await page.request.get(`${mock}/__auth/storage`)).json()) as StorageCall[];
  expect(
    calls.some((call) => call.kind === "upload" && call.path?.startsWith("payouts/73000000-")),
  ).toBe(true);
});

test("unknown payouts and closers get the not found screen", async ({ page }) => {
  await asAdmin(page);
  await page.goto("/es/admin/liquidaciones/73000000-0000-4000-8000-0000000000ff");
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  await page.goto("/es/admin/liquidaciones/no-es-un-id");
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
});

test("a closer cannot open the payouts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(list)}`);
  await page.goto(list);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
});

test("a failing query shows a retryable error", async ({ page, request }) => {
  await request.post(`${mock}/__auth/money-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await asAdmin(page);
  await expect(page.getByText(text.error.title)).toBeVisible();
  await expectClean(page);
});
