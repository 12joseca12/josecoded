import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin } from "./support/staff";

const mode = process.env.MOCK_CATALOG ?? "empty";
const review = "Precio en revisión";

const offersPath = "/es/servicios/a-medida";

test.describe("catalog read from the database", () => {
  test.skip(mode !== "empty", "default mock: every price is null");

  test("the web asks the catalog and keeps showing prices under review", async ({ page }) => {
    await page.goto(offersPath);
    const negocio = page.locator("[data-offer='web-negocio']");
    await expect(negocio.locator("[data-variant='review']")).toHaveText(review);
    await expect(page.locator("#garantia [data-plan] [data-variant='review']")).toHaveCount(3);
    const calls = await page.request.get(`${mockOrigin}/__catalog/calls`);
    expect(((await calls.json()) as { reads: number }).reads).toBeGreaterThanOrEqual(4);
  });
});

test.describe("catalog with prices", () => {
  test.skip(mode !== "priced", "needs MOCK_CATALOG=priced");

  test("tiers, maintenance plans and rates show the database prices", async ({ page }) => {
    await page.goto(offersPath);
    const negocio = page.locator("[data-offer='web-negocio']");
    await expect(negocio.locator("[data-variant='final']")).toContainText("2400");
    await expect(negocio.locator("[data-variant='review']")).toHaveCount(0);
    const plans = page.locator("#garantia [data-plan]");
    await expect(plans.locator("[data-variant='review']")).toHaveCount(0);
    await expect(page.locator("[data-plan='S']")).toContainText("49");
    await expect(page.locator("[data-plan='L']")).toContainText("199");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);

    await page.goto("/es/servicios/freelance");
    const rates = page.locator("#tarifas");
    await expect(rates).toContainText("60");
    await expect(rates).toContainText("150");
    await expect(rates.locator("[data-status='review']")).toHaveCount(0);
  });

  test("the contact page prices a selection from the database", async ({ page }) => {
    await page.goto("/es/contacto?offer=web-presencia&extras=seo");
    await expect(page.getByText("1300 €").first()).toBeAttached();
  });
});

test.describe("catalog unavailable", () => {
  test.skip(mode !== "down", "needs MOCK_CATALOG=down");

  test("the pages fall back to the code catalog without breaking", async ({ page }) => {
    const response = await page.goto(offersPath);
    expect(response?.status()).toBe(200);
    const negocio = page.locator("[data-offer='web-negocio']");
    await expect(negocio.locator("[data-variant='review']")).toHaveText(review);
    await expect(negocio).toContainText("4–6 semanas");
    const freelance = await page.goto("/es/servicios/freelance");
    expect(freelance?.status()).toBe(200);
    const llms = await page.request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    const calls = await page.request.get(`${mockOrigin}/__catalog/calls`);
    expect(((await calls.json()) as { reads: number }).reads).toBeGreaterThan(0);
  });
});
