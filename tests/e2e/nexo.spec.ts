import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  chat: { nexo: { label: Record<string, string> } };
  dev: { nexo: { reducedMotion: string } };
};
const labels = es.chat.nexo.label;
const states = Object.keys(labels);

test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

const floatTransform = (page: Page) =>
  page
    .locator('[data-testid="preview"] svg > g > g')
    .first()
    .evaluate((node) => getComputedStyle(node).transform);

test("the showcase renders every state with its accessible name", async ({ page }) => {
  await page.goto("/es/dev/nexo");
  const gallery = page.getByTestId("gallery");
  for (const state of states) {
    const nexo = gallery.locator(`svg[data-state="${state}"]`);
    await expect(nexo).toBeVisible();
    await expect(nexo).toHaveAttribute("role", "img");
    await expect(nexo).toHaveAttribute("aria-label", labels[state] ?? "");
  }
  expect(await gallery.locator("svg").count()).toBe(states.length);
});

test("the switcher changes the previewed state and the page has no axe violations", async ({
  page,
}) => {
  await page.goto("/es/dev/nexo");
  for (const state of states) {
    await page.locator(`[data-switch="${state}"]`).click();
    await expect(page.getByTestId("preview").locator("svg")).toHaveAttribute("data-state", state);
  }
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("idle floats by default", async ({ page }) => {
  await page.goto("/es/dev/nexo");
  await page.getByTestId("preview").locator("svg").waitFor();
  const first = await floatTransform(page);
  await page.waitForTimeout(700);
  expect(await floatTransform(page)).not.toBe(first);
});

test("reduced motion keeps a static pose", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es/dev/nexo");
  await expect(page.getByTestId("preview").locator("svg")).toHaveAttribute("data-reduced", "true");
  const first = await floatTransform(page);
  await page.waitForTimeout(700);
  expect(await floatTransform(page)).toBe(first);
});

test("the reduce motion toggle freezes the animation", async ({ page }) => {
  await page.goto("/es/dev/nexo");
  await page.getByTestId("preview").locator("svg").waitFor();
  await page.getByLabel(es.dev.nexo.reducedMotion).check();
  await expect(page.getByTestId("preview").locator("svg")).toHaveAttribute("data-reduced", "true");
  await page.waitForTimeout(500);
  const first = await floatTransform(page);
  await page.waitForTimeout(700);
  expect(await floatTransform(page)).toBe(first);
});
