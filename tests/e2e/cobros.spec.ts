import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";

import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Payments {
  title: string;
  tabs: Record<string, string>;
  empty: { tabTitle: string; title: string };
  error: { title: string; retry: string };
  table: { overdue: string; statuses: Record<string, string> };
  actions: Record<string, string>;
  documents: { empty: string; printAria: string; statuses: Record<string, string> };
  record: {
    title: string;
    amount: string;
    schedule: string;
    done: string;
    submit: string;
    errors: Record<string, string>;
  };
  scheduleSheet: {
    open: string;
    title: string;
    deal: string;
    template442: string;
    submit: string;
    done: string;
    sumOk: string;
    errors: Record<string, string>;
  };
  proformaSheet: {
    title: string;
    vat: string;
    submit: string;
    view: string;
    errors: Record<string, string>;
  };
  invoiceSheet: {
    title: string;
    number: string;
    file: string;
    submit: string;
    done: string;
    errors: Record<string, string>;
  };
  confirm: Record<string, string> & { errors: Record<string, string> };
}

interface Messages {
  errors: { notFound: { title: string } };
  admin: { payments: Payments };
  crm: {
    contact: {
      win: { open: string; openAria: string; title: string; wonAmount: string; submit: string };
    };
  };
}

interface StorageCall {
  kind: string;
  path?: string;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.admin.payments;
const win = es.crm.contact.win;

const ada = "/es/crm/contactos/20000000-0000-4000-8000-0000000000a1";
const cobros = "/es/admin/cobros";
const adaDeal = "30000000-0000-4000-8000-0000000000a1";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.51" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function asAdmin(page: Page, target: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, `?next=${encodeURIComponent(target)}`);
  await expect(page).toHaveURL(new RegExp(`${target.replace("?", "\\?")}$`));
}

function tab(page: Page, id: string) {
  return page.getByRole("link", { name: new RegExp(`^${text.tabs[id] ?? ""} \\(`) });
}

function row(page: Page, label: string): Locator {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: label, exact: true }) });
}

async function winAdaDeal(page: Page) {
  await page.goto(ada);
  await page
    .getByRole("button", { name: win.openAria.replace("{name}", "Ada Arquitecta") })
    .click();
  const dialog = page.getByRole("dialog", { name: win.title });
  await dialog.getByLabel(win.wonAmount).fill("3000");
  await dialog.getByRole("button", { name: win.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: win.openAria.replace("{name}", "Ada Arquitecta") }),
  ).toHaveCount(0);
}

async function planAdaSchedule(page: Page) {
  await page.goto(cobros);
  await page.getByRole("button", { name: text.scheduleSheet.open }).click();
  const dialog = page.getByRole("dialog", { name: text.scheduleSheet.title });
  await dialog.getByLabel(text.scheduleSheet.deal).selectOption({ label: "Ada Arquitecta" });
  await dialog.getByRole("button", { name: text.scheduleSheet.template442 }).click();
  await expect(dialog.getByText(text.scheduleSheet.sumOk)).toBeVisible();
  await dialog.getByRole("button", { name: text.scheduleSheet.submit }).click();
  await expect(dialog).toBeHidden();
}

test("the admin sees the tabs with counts and the overdue milestone", async ({ page }) => {
  await asAdmin(page, cobros);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await expect(tab(page, "pending")).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(text.empty.tabTitle)).toBeVisible();
  await expect(tab(page, "overdue")).toContainText("(1)");
  await expect(tab(page, "paid")).toContainText("(1)");
  await expect(tab(page, "proformas")).toContainText("(1)");
  await expectClean(page);

  await tab(page, "overdue").click();
  await expect(page).toHaveURL(/tab=overdue/);
  const overdue = row(page, "Entrega final 50 %");
  await expect(overdue).toContainText("Bruno Banco");
  await expect(overdue).toContainText(text.table.overdue);
  await expectClean(page);

  await page.setViewportSize({ width: 375, height: 800 });
  const spill = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(spill).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("the documents tabs list the proforma with its print link", async ({ page }) => {
  await asAdmin(page, `${cobros}?tab=proformas`);
  const proforma = row(page, "PF-2026-001");
  await expect(proforma).toContainText("Proforma");
  await expect(
    proforma.getByRole("link", {
      name: text.documents.printAria.replace("{number}", "PF-2026-001"),
    }),
  ).toHaveAttribute("href", /\/admin\/cobros\/proformas\/.+\/imprimir$/);
  await expectClean(page);
  await tab(page, "invoices").click();
  await expect(page.getByText(text.documents.empty)).toBeVisible();
});

test("recording a payment moves the milestone to paid and reports limits", async ({ page }) => {
  await asAdmin(page, `${cobros}?tab=overdue`);
  await row(page, "Entrega final 50 %")
    .getByRole("button", { name: /Cobrar Entrega final 50 %/ })
    .click();
  const dialog = page.getByRole("dialog", { name: text.record.title });
  await expect(dialog.getByLabel(text.record.amount)).toHaveValue("1400,00");
  await expectClean(page);

  await dialog.getByLabel(text.record.amount).fill("1.500");
  await dialog.getByRole("button", { name: text.record.submit }).click();
  await expect(dialog.getByText(text.record.errors.payment_exceeds_schedule ?? "")).toBeVisible();

  await dialog.getByLabel(text.record.amount).fill("1400");
  await dialog.getByRole("button", { name: text.record.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.record.done })).toBeAttached();
  await expect(tab(page, "overdue")).toContainText("(0)");
  await expect(tab(page, "paid")).toContainText("(2)");
});

test("a won deal gets a 40/40/20 schedule and a proforma", async ({ page }) => {
  await asAdmin(page, ada);
  await winAdaDeal(page);
  await planAdaSchedule(page);
  await expect(tab(page, "pending")).toContainText("(3)");
  await expect(row(page, "Anticipo")).toBeVisible();
  await expect(row(page, "Entrega final")).toContainText("600,00");

  await row(page, "Anticipo")
    .getByRole("button", { name: /Emitir proforma de Anticipo/ })
    .click();
  const dialog = page.getByRole("dialog", { name: text.proformaSheet.title });
  await expect(dialog.getByLabel(text.proformaSheet.vat)).toHaveValue("21");
  await dialog.getByLabel(text.proformaSheet.vat).fill("150");
  await dialog.getByRole("button", { name: text.proformaSheet.submit }).click();
  await expect(dialog.getByText(text.proformaSheet.errors.vat ?? "")).toBeVisible();
  await dialog.getByLabel(text.proformaSheet.vat).fill("21");
  await dialog.getByRole("button", { name: text.proformaSheet.submit }).click();
  await expect(dialog.getByRole("link", { name: text.proformaSheet.view })).toHaveAttribute(
    "href",
    /\/admin\/cobros\/proformas\/.+\/imprimir$/,
  );
  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await tab(page, "proformas").click();
  await expect(row(page, "PF-2026-002")).toContainText("1452,00");
});

test("an external invoice is registered with its PDF, which opens through a signed link", async ({
  page,
}) => {
  await asAdmin(page, ada);
  await winAdaDeal(page);
  await planAdaSchedule(page);

  await row(page, "Anticipo")
    .getByRole("button", { name: /Registrar la factura de Anticipo/ })
    .click();
  const dialog = page.getByRole("dialog", { name: text.invoiceSheet.title });
  await dialog.getByLabel(text.invoiceSheet.number).fill("PF-77");
  await dialog.getByRole("button", { name: text.invoiceSheet.submit }).click();
  await expect(
    dialog.getByText(text.invoiceSheet.errors.invoice_number_reserved ?? ""),
  ).toBeVisible();

  await dialog.getByLabel(text.invoiceSheet.number).fill("F-2026/0001");
  await dialog.getByLabel(text.invoiceSheet.file).setInputFiles({
    name: "factura.pdf",
    mimeType: "text/plain",
    buffer: Buffer.from("no soy un pdf"),
  });
  await dialog.getByRole("button", { name: text.invoiceSheet.submit }).click();
  await expect(dialog.getByText(text.invoiceSheet.errors.fileType ?? "")).toBeVisible();

  await dialog.getByLabel(text.invoiceSheet.file).setInputFiles({
    name: "factura.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%contenido\n"),
  });
  await dialog.getByRole("button", { name: text.invoiceSheet.submit }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: text.invoiceSheet.done })).toBeAttached();

  await tab(page, "invoices").click();
  const invoice = row(page, "F-2026/0001");
  const pdf = invoice.getByRole("link", { name: /Abrir PDF de la factura F-2026\/0001/ });
  await expect(pdf).toHaveAttribute("target", "_blank");
  const href = await pdf.getAttribute("href");
  const opened = await page.request.get(href ?? "");
  expect(opened.status()).toBe(200);
  expect(opened.headers()["content-type"]).toContain("application/pdf");

  const calls = (await (await page.request.get(`${mock}/__auth/storage`)).json()) as StorageCall[];
  expect(calls.some((call) => call.kind === "upload" && call.path?.startsWith(`${adaDeal}/`))).toBe(
    true,
  );
  expect(calls.some((call) => call.kind === "sign" && call.path?.startsWith(`${adaDeal}/`))).toBe(
    true,
  );
});

test("cancelling a milestone and voiding a proforma are confirmed", async ({ page }) => {
  await asAdmin(page, ada);
  await winAdaDeal(page);
  await planAdaSchedule(page);

  await row(page, "Entrega final")
    .getByRole("button", { name: /Cancelar el hito Entrega final/ })
    .click();
  const dialog = page.getByRole("dialog", { name: text.confirm.cancelTitle });
  await expectClean(page);
  await dialog.getByRole("button", { name: text.confirm.cancelSubmit }).click();
  await expect(dialog).toBeHidden();
  await expect(tab(page, "pending")).toContainText("(2)");

  await tab(page, "proformas").click();
  await row(page, "PF-2026-001")
    .getByRole("button", { name: /Anular el documento PF-2026-001/ })
    .click();
  const voidDialog = page.getByRole("dialog", { name: text.confirm.voidTitle });
  await voidDialog.getByRole("button", { name: text.confirm.voidSubmit }).click();
  await expect(voidDialog).toBeHidden();
  await expect(row(page, "PF-2026-001")).toContainText(text.documents.statuses.void ?? "");
});

test("a milestone with payments cannot be cancelled", async ({ page }) => {
  await asAdmin(page, `${cobros}?tab=overdue`);
  await row(page, "Entrega final 50 %")
    .getByRole("button", { name: /Cobrar Entrega final 50 %/ })
    .click();
  const record = page.getByRole("dialog", { name: text.record.title });
  await record.getByLabel(text.record.amount).fill("100");
  await record.getByRole("button", { name: text.record.submit }).click();
  await expect(record).toBeHidden();
  await row(page, "Entrega final 50 %")
    .getByRole("button", { name: /Cancelar el hito Entrega final/ })
    .click();
  const dialog = page.getByRole("dialog", { name: text.confirm.cancelTitle });
  await dialog.getByRole("button", { name: text.confirm.cancelSubmit }).click();
  await expect(dialog.getByText(text.confirm.errors.schedule_has_payments ?? "")).toBeVisible();
});

test("a closer gets the not found screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(cobros)}`);
  await page.goto(cobros);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toHaveCount(0);
});

test("a failing query shows a retryable error", async ({ page, request }) => {
  await request.post(`${mock}/__auth/money-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await asAdmin(page, cobros);
  await expect(page.getByText(text.error.title)).toBeVisible();
  await expect(page.getByRole("button", { name: text.error.retry })).toBeVisible();
  await expectClean(page);
});
