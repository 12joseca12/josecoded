import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  home: {
    hero: {
      title: string;
      accent: string;
      ctaPrimary: string;
      ctaSecondary: string;
      lead: string;
      identity: string;
      identityLink: string;
      demoTag: string;
      demoNote: string;
      rail: { list: string; pause: string; resume: string };
      phases: Record<string, string>;
    };
  };
};
const hero = es.home.hero;

const phaseButton = (page: Page, label: string) => page.getByRole("button", { name: label });
const rail = (page: Page) => page.getByRole("list", { name: hero.rail.list });

async function runningHeroAnimations(page: Page) {
  return page.evaluate(
    () =>
      document
        .getElementById("hero")
        ?.getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length ?? -1,
  );
}

test.describe("hero copy", () => {
  test("shows the headline, the lead and both calls to action", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${hero.title} ${hero.accent}`,
    );
    const primary = page.getByRole("link", { name: hero.ctaPrimary });
    await expect(primary).toHaveAttribute("href", "/es/contacto");
    const secondary = page.getByRole("link", { name: hero.ctaSecondary });
    await expect(secondary).toHaveAttribute("href", "/es/proyectos");
  });

  test("says who Jose is and offers the hiring route without scrolling", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByText(hero.lead)).toBeVisible();
    expect(hero.lead).toContain("en tu equipo");
    const identity = page.getByText(hero.identity, { exact: false });
    await expect(identity).toBeVisible();
    await expect(identity).toContainText("José Carlos Sánchez García");
    const link = page.getByRole("link", { name: hero.identityLink });
    await expect(link).toHaveAttribute("href", "/es/sobre-mi");
    await expect(link).toBeInViewport();
    await expect(identity).toBeInViewport();
  });

  test("marks the hero visual as a demo and hides localhost", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("[data-demo-tag]")).toHaveText(hero.demoTag);
    await expect(page.getByText(hero.demoNote)).toHaveCount(1);
    await expect(page.locator("#hero")).not.toContainText("localhost");
  });

  test("is the first block of the page", async ({ page }) => {
    await page.goto("/es");
    const first = page.locator("[data-block]").first();
    await expect(first).toHaveAttribute("id", "hero");
  });

  test("passes axe", async ({ page }) => {
    await page.goto("/es");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});

test.describe("phase rail", () => {
  test("lists the five phases as real buttons", async ({ page }) => {
    await page.goto("/es");
    const names = Object.values(hero.phases);
    expect(names).toHaveLength(5);
    await expect(phaseButton(page, hero.phases.discover ?? "")).toHaveAttribute(
      "aria-current",
      "step",
    );
    for (const name of names) await expect(phaseButton(page, name)).toBeVisible();
    await expect(rail(page).getByRole("listitem")).toHaveCount(5);
  });

  test("selecting a phase moves the sequence", async ({ page }) => {
    await page.goto("/es");
    await phaseButton(page, hero.phases.build ?? "").click();
    await expect(phaseButton(page, hero.phases.build ?? "")).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(phaseButton(page, hero.phases.discover ?? "")).not.toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  test("advances on its own when the ring completes", async ({ page }) => {
    await page.goto("/es");
    await expect(phaseButton(page, hero.phases.design ?? "")).toHaveAttribute(
      "aria-current",
      "step",
      { timeout: 8000 },
    );
  });

  test("pause stops the sequence and resume restarts it", async ({ page }) => {
    await page.goto("/es");
    const pause = page.getByRole("button", { name: hero.rail.pause });
    await expect(pause).toBeVisible();
    await pause.click();
    const resume = page.getByRole("button", { name: hero.rail.resume });
    await expect(resume).toBeVisible();
    await page.waitForTimeout(4500);
    await expect(phaseButton(page, hero.phases.discover ?? "")).toHaveAttribute(
      "aria-current",
      "step",
    );
    await resume.click();
    await expect(phaseButton(page, hero.phases.design ?? "")).toHaveAttribute(
      "aria-current",
      "step",
      { timeout: 8000 },
    );
  });

  test("pauses when the hero scrolls out of view", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("button", { name: hero.rail.pause })).toBeVisible();
    await page.evaluate(() => {
      document.body.style.paddingBottom = "4000px";
      scrollTo({ top: 2000, behavior: "instant" });
    });
    await expect(page.locator("[data-phase]")).toHaveAttribute("data-paused", "");
    await page.evaluate(() => {
      scrollTo({ top: 0, behavior: "instant" });
    });
    await expect(page.locator("[data-phase]")).not.toHaveAttribute("data-paused", "");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the static Publicar composition with no loop", async ({ page }) => {
    await page.goto("/es");
    const stage = page.locator("[data-phase]");
    await expect(stage).toHaveAttribute("data-phase", "3");
    await expect(rail(page).locator('[aria-current="step"]')).toHaveText(hero.phases.publish ?? "");
    await expect(page.getByRole("button", { name: hero.rail.pause })).toHaveCount(0);
    for (const button of await rail(page).getByRole("button").all()) {
      await expect(button).toBeDisabled();
    }
    await page.waitForTimeout(4500);
    await expect(stage).toHaveAttribute("data-phase", "3");
    expect(await runningHeroAnimations(page)).toBe(0);
  });

  test("passes axe", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("[data-phase]")).toHaveAttribute("data-phase", "3");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});

test.describe("narrow screens", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("does not scroll sideways and keeps the rail inside the viewport", async ({ page }) => {
    await page.goto("/es");
    const metrics = await page.evaluate(() => {
      const right = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().right ?? 0;
      return {
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
        hero: right("#hero"),
        stage: right("[data-phase]"),
      };
    });
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
    expect(metrics.hero).toBeLessThanOrEqual(metrics.width);
    expect(metrics.stage).toBeLessThanOrEqual(metrics.width);
    for (const label of Object.values(hero.phases)) {
      const box = await phaseButton(page, label).boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(metrics.width);
    }
  });

  test("passes axe", async ({ page }) => {
    await page.goto("/es");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});

test.describe("block scrolling with the hero", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("one wheel gesture glides to the next block and Home returns", async ({ page }) => {
    await page.goto("/es");
    await page.waitForLoadState("networkidle");
    const next = () =>
      page.evaluate(() => {
        const top = document.getElementById("vias")?.getBoundingClientRect().top ?? 0;
        return Math.round(top + scrollY);
      });
    expect(await next()).toBeGreaterThan(0);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(async () => (await page.evaluate(() => scrollY)) === (await next()), { timeout: 4000 })
      .toBe(true);
    await page.keyboard.press("Home");
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 4000 }).toBe(0);
  });
});
