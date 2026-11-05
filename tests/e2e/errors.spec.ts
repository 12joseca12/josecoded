import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  errors: Record<"notFound" | "serverError", { title: string; text: string }> & {
    actions: Record<"home" | "contact" | "retry", string>;
  };
  dev: { errors: { recovered: string } };
};
const { errors } = es;

test("unknown path returns 404 and the localized page with focus on the heading", async ({
  page,
}) => {
  const response = await page.goto("/es/no-existe");
  expect(response?.status()).toBe(404);
  const heading = page.getByRole("heading", { level: 1, name: errors.notFound.title });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.getByRole("link", { name: errors.actions.home })).toHaveAttribute(
    "href",
    "/es",
  );
  await expect(page.getByRole("link", { name: errors.actions.contact })).toHaveAttribute(
    "href",
    "/es/contacto",
  );
  await expect(page.locator('main a[href*="/chat"]')).toHaveCount(0);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("nested unknown path also returns 404", async ({ page }) => {
  const response = await page.goto("/es/uno/dos/tres");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: errors.notFound.title })).toBeVisible();
});

test("errors preview is axe clean", async ({ page }) => {
  await page.goto("/es/dev/ui/errors");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("a thrown error shows error.tsx and Reintentar recovers", async ({ page }) => {
  await page.goto("/es/dev/throw");
  const heading = page.getByRole("heading", { level: 1, name: errors.serverError.title });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await page.getByRole("button", { name: errors.actions.retry }).click();
  await expect(page.getByText(es.dev.errors.recovered)).toBeVisible();
});
