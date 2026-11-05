import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  meta: { titleTemplate: string };
  about: { head: { title: string; accent: string }; meta: { title: string } };
};

async function trackTransitionAnimations(page: Page) {
  await page.evaluate(() => {
    const seen = new Set<string>();
    Object.assign(window, { seenTransitionAnimations: seen });
    const poll = () => {
      for (const animation of document.getAnimations()) {
        const target = animation.effect as KeyframeEffect | null;
        const pseudo = target?.pseudoElement ?? "";
        const name = (animation as CSSAnimation).animationName;
        if (pseudo.startsWith("::view-transition")) seen.add(name);
      }
      requestAnimationFrame(poll);
    };
    poll();
  });
}

async function seenAnimations(page: Page) {
  return page.evaluate(() =>
    Array.from(
      (window as unknown as { seenTransitionAnimations: Set<string> }).seenTransitionAnimations,
    ),
  );
}

test("navigating to sobre mi keeps the header, focuses main and passes axe", async ({ page }) => {
  await page.goto("/es");
  await page.evaluate(() => {
    const header = document.querySelector("header");
    if (header) Object.assign(header, { stableMarker: true });
  });
  const before = await page.locator("header").first().boundingBox();

  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Sobre mí" })
    .click();
  await expect(page).toHaveURL(/\/es\/sobre-mi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${es.about.head.title} ${es.about.head.accent}`,
  );

  await expect(page.locator("#content")).toBeFocused();
  const aboutTitle = es.meta.titleTemplate.replace("%s", es.about.meta.title);
  await expect(page.getByRole("status")).toHaveText(aboutTitle);
  await expect(page).toHaveTitle(aboutTitle);

  const stable = await page.evaluate(
    () => (document.querySelector("header") as unknown as { stableMarker?: boolean }).stableMarker,
  );
  expect(stable).toBe(true);
  expect(await page.locator("header").first().boundingBox()).toEqual(before);
  expect(
    await page
      .locator("header")
      .first()
      .evaluate((el) => getComputedStyle(el).viewTransitionName),
  ).toBe("site-header");

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("a single main landmark exists on every public page", async ({ page }) => {
  for (const path of ["/es", "/es/sobre-mi", "/es/no-existe"]) {
    await page.goto(path);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

test("the page swap animates when motion is allowed", async ({ page }) => {
  await page.goto("/es");
  await trackTransitionAnimations(page);
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Sobre mí" })
    .click();
  await expect(page).toHaveURL(/\/es\/sobre-mi$/);
  await expect.poll(() => seenAnimations(page)).toContain("page-in");
});

test("reduced motion runs no view transition animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");
  await trackTransitionAnimations(page);
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Sobre mí" })
    .click();
  await expect(page).toHaveURL(/\/es\/sobre-mi$/);
  await expect(page.locator("#content")).toBeFocused();
  await page.waitForTimeout(800);
  expect(await seenAnimations(page)).toEqual([]);
});
