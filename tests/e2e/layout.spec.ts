import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  nav: { skipLink: string; menuOpen: string; menuClose: string; cta: string };
};

for (const width of [1440, 390]) {
  test(`header and footer pass axe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/es");
    await expect(page.getByRole("banner")).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .include("header")
      .include("footer")
      .analyze();
    expect(violations).toEqual([]);
  });
}

test("desktop shows the nav and hides the menu button", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es");
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
  await expect(page.getByRole("button", { name: es.nav.menuOpen })).toBeHidden();
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens and closes with the keyboard and returns focus", async ({ page }) => {
    await page.goto("/es");
    const trigger = page.getByRole("button", { name: es.nav.menuOpen });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("traps focus inside the dialog", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.menuOpen }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const active = document.activeElement;
        return active === document.body || active?.closest("dialog") !== null;
      });
      expect(inside).toBe(true);
    }
  });

  test("close button closes it", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.menuOpen }).click();
    await page.getByRole("button", { name: es.nav.menuClose }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test("skip link moves focus to the content", async ({ page }) => {
  await page.goto("/es");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: es.nav.skipLink });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#content$/);
  await expect(page.locator("#content")).toBeFocused();
});
