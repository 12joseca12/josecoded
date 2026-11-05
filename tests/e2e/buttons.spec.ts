import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  dev: {
    ui: Record<
      "stateDefault" | "stateDisabled" | "stateLoading" | "asLink" | "withoutIcon",
      string
    >;
  };
  services: { nav: { label: string } };
};
const ui = es.dev.ui;
const bubbles = '[style*="--dx"]';

async function trackSpawns(page: Page) {
  await page.addInitScript((selector) => {
    const spawns = { total: 0, hidden: 0, inert: 0 };
    Object.defineProperty(window, "bubbleSpawns", { value: spawns });
    new MutationObserver((records) => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof Element) || !added.matches(selector)) continue;
          spawns.total += 1;
          if (added.getAttribute("aria-hidden") === "true") spawns.hidden += 1;
          if (getComputedStyle(added).pointerEvents === "none") spawns.inert += 1;
        }
      }
    }).observe(document, { childList: true, subtree: true });
  }, bubbles);
}

const readSpawns = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { bubbleSpawns: Record<"total" | "hidden" | "inert", number> })
        .bubbleSpawns,
  );
const spawned = async (page: Page) => (await readSpawns(page)).total;

async function hydrated(button: Locator) {
  await expect
    .poll(() =>
      button.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))),
    )
    .toBe(true);
}

test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

test("pressing a button releases 5 to 7 bubbles that clean themselves up", async ({ page }) => {
  await trackSpawns(page);
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await hydrated(button);
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => spawned(page)).toBeGreaterThanOrEqual(5);
  const spawns = await readSpawns(page);
  expect(spawns.total).toBeLessThanOrEqual(7);
  expect(spawns.hidden).toBe(spawns.total);
  expect(spawns.inert).toBe(spawns.total);
  await page.mouse.up();
  await expect.poll(() => page.locator(bubbles).count(), { timeout: 3000 }).toBe(0);
});

test("Enter on a focused button releases bubbles", async ({ page }) => {
  await trackSpawns(page);
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await hydrated(button);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => spawned(page)).toBeGreaterThanOrEqual(5);
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

test("holding Enter spawns bubbles once, not on every repeat", async ({ page }) => {
  await trackSpawns(page);
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await hydrated(button);
  await button.focus();
  await page.keyboard.down("Enter");
  await expect.poll(() => spawned(page)).toBeGreaterThanOrEqual(5);
  const first = await spawned(page);
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  expect(await spawned(page)).toBe(first);
  await page.keyboard.up("Enter");
});

test("a loading button spawns no bubbles", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: new RegExp(ui.stateLoading) }).first();
  await expect(button).toBeDisabled();
  await button.dispatchEvent("pointerdown", { button: 0 });
  await page.waitForTimeout(200);
  expect(await page.locator(bubbles).count()).toBe(0);
});

test("Space on a link button spawns nothing, Enter does", async ({ page }) => {
  await trackSpawns(page);
  await page.goto("/es/dev/ui");
  const link = page.getByRole("link", { name: ui.asLink }).first();
  await hydrated(link);
  await link.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  expect(await page.locator(bubbles).count()).toBe(0);
  await page.keyboard.press("Enter");
  await expect.poll(() => spawned(page)).toBeGreaterThanOrEqual(5);
});

test("bubbles sit behind the label", async ({ page }) => {
  await page.addInitScript((selector) => {
    const probe = { hit: "none" };
    Object.defineProperty(window, "labelProbe", { value: probe });
    new MutationObserver((records) => {
      if (probe.hit !== "none") return;
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof HTMLElement) || !added.matches(selector)) continue;
          added.style.pointerEvents = "auto";
          const button = added.closest("button");
          const label = button?.querySelector(":scope > span:not([data-burst])");
          if (!label) {
            probe.hit = "no-label";
            return;
          }
          const rect = label.getBoundingClientRect();
          const top = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          probe.hit = top?.closest("[data-burst]") ? "bubble" : "label";
          return;
        }
      }
    }).observe(document, { childList: true, subtree: true });
  }, bubbles);
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.withoutIcon }).first();
  await hydrated(button);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { labelProbe: { hit: string } }).labelProbe.hit),
    )
    .toBe("label");
});

test("pressing is deeper than hovering", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  await page.mouse.down();
  await expect
    .poll(() => button.evaluate((node) => getComputedStyle(node).transform))
    .toBe("matrix(0.95, 0, 0, 0.95, 0, 0)");
  await page.mouse.up();
});

test("pressing is deeper than hovering with reduced motion: stronger ring only", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  const hovered = await button.evaluate((node) => getComputedStyle(node).boxShadow);
  await page.mouse.down();
  await expect
    .poll(() => button.evaluate((node) => getComputedStyle(node).boxShadow))
    .not.toBe(hovered);
  expect(await button.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await page.mouse.up();
});

test("the hit area is larger than the shrunk button", async ({ page }) => {
  await page.goto("/es/dev/ui");
  const button = page.getByRole("button", { name: ui.stateDefault }).first();
  await button.hover();
  await expect
    .poll(() => button.evaluate((node) => node.getAnimations({ subtree: true }).length))
    .toBe(0);
  const box = await button.boundingBox();
  if (!box) throw new Error("no box");
  await page.mouse.move(box.x - 2, box.y + box.height / 2);
  await expect.poll(() => button.evaluate((node) => node.matches(":hover"))).toBe(true);
});

test.describe("touch", () => {
  test.use({ hasTouch: true });

  test("bubbles come on tap activation", async ({ page }) => {
    await trackSpawns(page);
    await page.goto("/es/dev/ui");
    const button = page.getByRole("button", { name: ui.stateDefault }).first();
    await hydrated(button);
    await button.tap();
    await expect.poll(() => spawned(page)).toBeGreaterThanOrEqual(5);
    await expect.poll(() => page.locator(bubbles).count(), { timeout: 3000 }).toBe(0);
  });
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
  await page.goto("/es/servicios/freelance");
  const list = page.getByRole("navigation", { name: es.services.nav.label }).locator("ul");
  await expect(list).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(list).toHaveCSS("overscroll-behavior-x", "contain");
  await expect(list.locator("> li").first()).toHaveCSS("scroll-snap-align", "start");
});
