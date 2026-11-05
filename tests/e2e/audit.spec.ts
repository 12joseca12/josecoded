import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

interface Messages {
  auditPage: {
    head: { title: string; accent: string };
    closing: { cta: string };
    review: { title: string };
    deliver: { title: string };
    price: { title: string };
    meta: { description: string };
    schema: { name: string; type: string };
  };
  services: {
    audit: { title: string; more: string };
    price: { review: string };
    ways: { audit: { nav: string } };
    nav: { label: string };
  };
  contactPage: { form: { messageLabel: string; auditMessage: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const copy = es.auditPage;
const path = "/es/servicios/auditoria";

interface Node {
  "@type": string;
  [key: string]: unknown;
}

async function readNodes(page: Page): Promise<Node[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text) => (JSON.parse(text) as { "@graph": Node[] })["@graph"]);
}

test("the H1 carries the keyword and the page lists the six review areas", async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Auditoría web");
  await expect(page.locator("#revision [data-term]")).toHaveCount(6);
  await expect(page.locator("#entrego [data-term]")).toHaveCount(3);
  await expect(page.locator("#pasos ol > li")).toHaveCount(4);
  await expect(page.locator("#precio [data-variant='review']")).toContainText(
    es.services.price.review,
  );
  await expect(page.locator("main")).not.toContainText(/\{\{DATO/);
});

test("no legal promise and no invented figure on the page", async ({ page }) => {
  await page.goto(path);
  const text = (await page.locator("main").textContent()) ?? "";
  expect(text).not.toMatch(/€|\d+\s?%|obliga|sanci|multa|garantiz/i);
});

test("the JSON-LD has Service without a price, FAQPage and BreadcrumbList", async ({ page }) => {
  await page.goto(path);
  const nodes = await readNodes(page);
  expect(nodes.map((node) => node["@type"])).toEqual(
    expect.arrayContaining(["BreadcrumbList", "FAQPage", "Service"]),
  );
  const service = nodes.find((node) => node["@type"] === "Service");
  expect(service?.name).toBe(copy.schema.name);
  expect(service?.serviceType).toBe(copy.schema.type);
  expect(service?.url).toBe("http://localhost:3000/es/servicios/auditoria");
  expect(JSON.stringify(service)).not.toMatch(/price|offers|€/i);
});

test("the closing button opens the freelance form with the audit line prefilled", async ({
  page,
}) => {
  await page.goto(path);
  const cta = page.locator("#contacto").getByRole("link", { name: copy.closing.cta });
  await expect(cta).toHaveAttribute("href", "/es/contacto?via=freelance&task=audit#formulario");
  await cta.click();
  await expect(page).toHaveURL(/\/es\/contacto\?via=freelance&task=audit/);
  const message = page.locator("#formulario").getByLabel(es.contactPage.form.messageLabel);
  await expect(message).toHaveValue(es.contactPage.form.auditMessage);
});

test("the hub links to the audit without adding a fifth tile", async ({ page }) => {
  await page.goto("/es/servicios");
  await expect(page.locator("#vias article")).toHaveCount(4);
  const link = page.locator("#auditoria").getByRole("link", { name: es.services.audit.more });
  await expect(link).toHaveAttribute("href", path);
  await link.click();
  await expect(page).toHaveURL(/\/es\/servicios\/auditoria$/);
});

test("the way navigation of the other child pages offers the audit", async ({ page }) => {
  for (const other of ["/es/servicios/freelance", "/es/servicios/a-medida"]) {
    await page.goto(other);
    const nav = page.getByRole("navigation", { name: es.services.nav.label });
    await expect(nav.getByRole("link", { name: es.services.ways.audit.nav })).toHaveAttribute(
      "href",
      path,
    );
  }
});

test("sitemap and llms.txt list the audit page", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/es/servicios/auditoria");
  const llms = await request.get("/llms.txt");
  expect(await llms.text()).toContain("/es/servicios/auditoria");
});
