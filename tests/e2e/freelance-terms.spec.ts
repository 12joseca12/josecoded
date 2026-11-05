import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

interface Messages {
  freelancePage: {
    scope: {
      sizeLabel: string;
      note: string;
      a11y: { title: string; size: string; deliverable: string };
    };
    pilot: { text: string; cta: string };
    availability: { label: string };
    terms: { title: string; invoice: { title: string; text: string } };
  };
  contactPage: { form: { messageLabel: string; pilotMessage: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const copy = es.freelancePage;
const path = "/es/servicios/freelance";

test("task examples list five tasks with an indicative size and a deliverable", async ({
  page,
}) => {
  await page.goto(path);
  const tasks = page.locator("#incluye article[data-task]");
  await expect(tasks).toHaveCount(5);
  for (const task of await tasks.all()) {
    await expect(task.getByText(copy.scope.sizeLabel)).toBeVisible();
    await expect(task.locator("dd")).toHaveCount(2);
  }
  const a11y = page.locator("#incluye article[data-task='a11y']");
  await expect(a11y).toContainText(copy.scope.a11y.title);
  await expect(a11y).toContainText(copy.scope.a11y.size);
  await expect(a11y).toContainText(copy.scope.a11y.deliverable);
  await expect(page.locator("#incluye")).toContainText(copy.scope.note);
  await expect(page.locator("#incluye")).not.toContainText("€");
});

test("terms strip has four confirmed facts and no pending marker", async ({ page }) => {
  await page.goto(path);
  await expect(page.locator("#condiciones dt")).toHaveCount(4);
  await expect(page.locator("#condiciones dd[data-pending]")).toHaveCount(0);
  await expect(page.locator("#condiciones")).not.toContainText("IVA");
  const invoice = page.locator("#condiciones [data-term='invoice']");
  await expect(invoice).toContainText(copy.terms.invoice.title);
  await expect(invoice).toContainText(copy.terms.invoice.text);
  const list = page.locator("#condiciones dl");
  await expect(list).toHaveAccessibleName(copy.terms.title);
});

test("pilot task offers a small closed task and links to the freelance form", async ({ page }) => {
  await page.goto(path);
  const pilot = page.locator("#tarea-piloto");
  await expect(pilot).toContainText(copy.pilot.text);
  const cta = pilot.getByRole("link", { name: copy.pilot.cta });
  await expect(cta).toHaveAttribute("href", "/es/contacto?via=freelance&task=pilot#formulario");
  await cta.click();
  await expect(page).toHaveURL(/\/es\/contacto\?via=freelance&task=pilot/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the pilot link prefills a visible, editable line in the contact message", async ({
  page,
}) => {
  await page.goto("/es/contacto?via=freelance&task=pilot#formulario");
  const message = page.locator("#formulario").getByLabel(es.contactPage.form.messageLabel);
  await expect(message).toHaveValue(es.contactPage.form.pilotMessage);
  await message.fill(`${es.contactPage.form.pilotMessage} Necesito revisar el login.`);
  await expect(message).toHaveValue(/Necesito revisar el login\.$/);
  await page.goto("/es/contacto?via=freelance#formulario");
  await expect(
    page.locator("#formulario").getByLabel(es.contactPage.form.messageLabel),
  ).toHaveValue("");
});

test("availability stays hidden while there is no data", async ({ page }) => {
  await page.goto(path);
  await expect(page.locator("#tarifas")).toBeVisible();
  await expect(page.getByText(copy.availability.label)).toHaveCount(0);
  await expect(page.locator("[data-availability]")).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`new freelance blocks pass axe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expect(page.locator("#tarea-piloto")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}
