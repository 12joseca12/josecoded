import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

test("prose page renders every MDX element and passes axe", async ({ page }) => {
  await page.goto("/es/dev/ui/prose");
  await expect(
    page.getByRole("heading", { level: 2, name: "Titular de segundo nivel" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Titular de segundo nivel" })).toHaveAttribute(
    "href",
    "#titular-de-segundo-nivel",
  );
  await expect(page.getByRole("list").first()).toBeVisible();
  await expect(page.locator("pre code")).toContainText("export function sum");
  await expect(page.getByRole("img", { name: /Degradado de acero/ })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.locator("blockquote")).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
