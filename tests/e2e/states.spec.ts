import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  dev: {
    ui: Record<
      | "toastSuccess"
      | "toastSuccessText"
      | "toastClose"
      | "toastError"
      | "toastErrorText"
      | "errorRetry"
      | "errorRetried"
      | "loadingRegionLabel"
      | "toggleLoading"
      | "loadedContent",
      string
    >;
  };
};
const ui = es.dev.ui;

test("success toast is announced in a status region and closes with the keyboard", async ({
  page,
}) => {
  await page.goto("/es/dev/ui");
  await page.getByRole("button", { name: ui.toastSuccess }).click();
  const toast = page.getByRole("status").filter({ hasText: ui.toastSuccessText });
  await expect(toast).toBeVisible();
  await toast.hover();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
  const close = page.getByRole("button", { name: ui.toastClose });
  for (
    let step = 0;
    step < 4 && !(await close.evaluate((node) => node === document.activeElement));
    step++
  ) {
    await page.keyboard.press("Tab");
  }
  await expect(close).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toast).toBeHidden();
});

test("error toast is announced as an alert", async ({ page }) => {
  await page.goto("/es/dev/ui");
  await page.getByRole("button", { name: ui.toastError }).click();
  await expect(page.getByRole("alert").filter({ hasText: ui.toastErrorText })).toBeVisible();
});

test("error state retry shows loading and then finishes", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const retry = page.getByRole("button", { name: ui.errorRetry });
  await retry.click();
  await expect(retry).toHaveAttribute("aria-busy", "true");
  await expect(page.getByText(ui.errorRetried)).toBeVisible();
  await expect(retry).not.toHaveAttribute("aria-busy", "true");
});

test("loading region swaps skeleton for content", async ({ page }) => {
  await page.goto("/es/dev/ui");
  await expect(page.getByRole("status").filter({ hasText: ui.loadingRegionLabel })).toBeAttached();
  await page.getByRole("button", { name: ui.toggleLoading }).click();
  await expect(page.getByText(ui.loadedContent)).toBeVisible();
});
