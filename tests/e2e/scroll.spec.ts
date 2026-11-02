import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

test.describe("block scrolling on desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("one wheel gesture moves to the next block and keyboard goes back", async ({ page }) => {
    await page.goto("/es/dev/scroll");
    await expect(page.getByTestId("progress")).toHaveText("0");

    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBe(900);

    await page.waitForTimeout(900);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => scrollY)).toBe(900 + 120);

    await page.keyboard.press("Home");
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBe(0);
  });

  test("progress reaches 100 at the bottom", async ({ page }) => {
    await page.goto("/es/dev/scroll");
    await page.keyboard.press("End");
    await expect(page.getByTestId("progress")).toHaveText("100", { timeout: 3000 });
  });

  test("passes axe", async ({ page }) => {
    await page.goto("/es/dev/scroll");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});

test.describe("native scrolling", () => {
  test("reduced motion keeps the wheel native", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/dev/scroll");
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(120);
  });

  test("narrow viewports keep the wheel native", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/es/dev/scroll");
    await page.mouse.move(100, 400);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(120);
  });
});

test.describe("page scrollbar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("is hidden while the page keeps scrolling", async ({ page }) => {
    await page.goto("/es/dev/scroll");
    const metrics = await page.evaluate(() => ({
      width: getComputedStyle(document.documentElement).scrollbarWidth,
      gap: window.innerWidth - document.documentElement.clientWidth,
    }));
    expect(metrics.width).toBe("none");
    expect(metrics.gap).toBe(0);

    await page.keyboard.press("End");
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(0);
  });
});
