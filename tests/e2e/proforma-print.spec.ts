import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Messages {
  errors: { notFound: { title: string } };
  admin: {
    proformaPrint: {
      back: string;
      print: string;
      heading: string;
      notInvoice: string;
      void: string;
      issuer: { name: string; taxId: string };
    };
  };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.admin.proformaPrint;

const proforma = "/es/admin/cobros/proformas/71000000-0000-4000-8000-000000000001/imprimir";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.52" } });

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
  await expect(page).toHaveURL(new RegExp(`${target}$`));
}

test("the admin sees a proforma that says it is not an invoice, and it passes axe", async ({
  page,
}) => {
  await asAdmin(page, proforma);
  await expect(page.getByRole("heading", { level: 1, name: text.heading })).toBeVisible();
  await expect(page.getByRole("note")).toContainText(text.notInvoice);
  await expect(page.getByText("PF-2026-001", { exact: true })).toBeVisible();
  await expect(page.getByText(text.issuer.name)).toBeVisible();
  await expect(page.getByText("Bruno Banco")).toBeVisible();
  await expect(page.getByText(/Entrega final 50 %/)).toBeVisible();
  await expect(page.getByRole("row", { name: /Total/ })).toContainText("1400,00");
  await expect(page.getByRole("button", { name: text.print })).toBeVisible();
  await expectClean(page);

  await page.setViewportSize({ width: 375, height: 800 });
  const spill = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(spill).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("printing hides the staff chrome and the controls and keeps the document", async ({
  page,
}) => {
  await asAdmin(page, proforma);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: text.print })).toBeHidden();
  await expect(page.getByRole("link", { name: text.back })).toBeHidden();
  await expect(page.getByRole("navigation")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: text.heading })).toBeVisible();
  await expect(page.getByRole("note")).toBeVisible();
});

test("the print button asks the browser to print", async ({ page }) => {
  await asAdmin(page, proforma);
  await page.evaluate(() => {
    const target = window as unknown as { printed: number; print: () => void };
    target.printed = 0;
    target.print = () => {
      target.printed += 1;
    };
  });
  await page.getByRole("button", { name: text.print }).click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
});

test("an unknown or malformed id is a 404 and a closer cannot open it", async ({ page }) => {
  await asAdmin(page, proforma);
  await page.goto("/es/admin/cobros/proformas/71000000-0000-4000-8000-0000000000ff/imprimir");
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  await page.goto("/es/admin/cobros/proformas/no-es-un-id/imprimir");
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
});

test("a closer gets the not found screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, `?next=${encodeURIComponent(proforma)}`);
  await page.goto(proforma);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: text.heading })).toHaveCount(0);
});
