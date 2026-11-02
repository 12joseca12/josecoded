import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  dev: { ui: Record<"stateDefault" | "stateDisabled", string> };
  services: { nav: { label: string } };
};
const ui = es.dev.ui;
const bubbles = '[style*="--dx"]';

test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

test("pressing a button releases 5 to 7 bubbles that clean themselves up", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => page.locator(bubbles).count()).toBeGreaterThanOrEqual(5);
  expect(await page.locator(bubbles).count()).toBeLessThanOrEqual(7);
  await expect(page.locator(bubbles).first()).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(bubbles).first()).toHaveCSS("pointer-events", "none");
  await page.mouse.up();
  await expect.poll(() => page.locator(bubbles).count(), { timeout: 3000 }).toBe(0);
});

test("Enter on a focused button releases bubbles", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.locator(bubbles).count()).toBeGreaterThanOrEqual(5);
  await expect.poll(() => page.locator(bubbles).count(), { timeout: 3000 }).toBe(0);
});

test("no bubbles with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  expect(await page.locator(bubbles).count()).toBe(0);
  await page.mouse.up();
});

test("no bubbles on a disabled button", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDisabled }).first();
  await button.dispatchEvent("pointerdown", { button: 0 });
  await page.waitForTimeout(200);
  expect(await page.locator(bubbles).count()).toBe(0);
});

test("hover shows the pressed look: scaled down with a ring", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  await expect
    .poll(() => button.evaluate((node) => getComputedStyle(node).transform))
    .toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
});

test("way nav snaps item to item on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/es/servicios");
  const list = page.getByRole("navigation", { name: es.services.nav.label }).locator("ul");
  await expect(list).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(list).toHaveCSS("overscroll-behavior-x", "contain");
  await expect(list.locator("> li").first()).toHaveCSS("scroll-snap-align", "start");
});
