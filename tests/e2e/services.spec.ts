import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  services: {
    nav: { label: string };
    ways: Record<"contratacion" | "freelance" | "packs", { nav: string }>;
  };
};
const wayNav = es.services.nav.label;
const ways = es.services.ways;

for (const width of [1440, 390]) {
  test(`services page passes axe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/es/servicios");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}

test("has one h1, three h2 and the three way sections as blocks", async ({ page }) => {
  await page.goto("/es/servicios");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);
  await expect(page.locator("section[data-block]")).toHaveCount(3);
  await expect(page.locator("main")).toHaveCount(1);
});

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test(`way nav anchors move to sections and update aria-current on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/es/servicios");
    const nav = page.getByRole("navigation", { name: wayNav });
    for (const id of ["freelance", "packs", "contratacion"] as const) {
      await nav.getByRole("link", { name: ways[id].nav }).click();
      await expect(nav.getByRole("link", { name: ways[id].nav })).toHaveAttribute(
        "aria-current",
        "location",
      );
      await expect(nav.locator("[aria-current]")).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThan(viewport.height / 2);
    }
  });
}

test("way nav does not cover the section content at 360", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/es/servicios#freelance");
  const nav = page.getByRole("navigation", { name: wayNav });
  await expect(nav.getByRole("link", { name: ways.freelance.nav })).toHaveAttribute(
    "aria-current",
    "location",
  );
  const navBottom = await nav.evaluate((el) => el.getBoundingClientRect().bottom);
  const headingTop = await page
    .locator("#freelance h2")
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(navBottom);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(360);
});
