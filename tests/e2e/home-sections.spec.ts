import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

interface Messages {
  home: {
    services: { title: string };
    stack: { title: string };
    how: { line: string };
    closing: { title: string; accent: string; cta: string };
    recommender: { more: string };
  };
  offersPage: {
    recommender: {
      title: string;
      questions: {
        start: {
          legend: string;
          options: Record<"idea" | "defined" | "existing", { label: string }>;
        };
      };
    };
  };
  services: {
    bento: {
      needs: Record<"contratacion" | "project" | "freelance", { title: string }>;
      proof: { stack: string };
    };
    how: { more: string };
  };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const cv = JSON.parse(readFileSync("content/cv.json", "utf8")) as {
  stack: { group: string; items: { name: string }[] }[];
};

test.describe("home sections below the hero", () => {
  test("routes each situation to its page without prices", async ({ page }) => {
    await page.goto("/es");
    const section = page.getByRole("region", { name: es.home.services.title });
    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(es.home.services.title);
    const needs = es.services.bento.needs;
    await expect(
      section.getByRole("heading", { level: 3, name: needs.contratacion.title }),
    ).toBeVisible();
    await expect(section.locator('a[href="/es/servicios/a-medida"]')).toHaveCount(1);
    await expect(section.locator('a[href="/es/servicios/freelance"]')).toHaveCount(1);
    await expect(section.locator('a[href="/es/sobre-mi"]')).toHaveCount(1);
    await expect(section).not.toContainText("€");
  });

  test("the recommender teaser links each answer with step one answered", async ({ page }) => {
    await page.goto("/es");
    const start = es.offersPage.recommender.questions.start;
    const group = page.getByRole("group", { name: start.legend });
    await expect(group).toBeVisible();
    const idea = group.getByRole("link", { name: start.options.idea.label });
    await expect(idea).toHaveAttribute("href", "/es/servicios/a-medida?q=idea#recomendador");
    await expect(group.getByRole("link", { name: start.options.existing.label })).toHaveAttribute(
      "href",
      "/es/servicios/a-medida?q=existing#recomendador",
    );
    await idea.click();
    await expect(page).toHaveURL(/\/es\/servicios\/a-medida\?q=idea/);
  });

  test("the stack row lists real stack items and links to the CV stack", async ({ page }) => {
    await page.goto("/es");
    const section = page.getByRole("region", { name: es.home.stack.title });
    const mobile = cv.stack.find((entry) => entry.group === "mobile");
    const first = mobile?.items[0]?.name ?? "";
    await expect(section).toContainText(first);
    await expect(
      section.getByRole("link", { name: es.services.bento.proof.stack }),
    ).toHaveAttribute("href", "/es/sobre-mi#stack");
  });

  test("the how strip is one line with a link", async ({ page }) => {
    await page.goto("/es");
    const strip = page.locator("#como-trabajo");
    await expect(strip).toContainText(es.home.how.line);
    await expect(strip.getByRole("link", { name: es.services.how.more })).toHaveAttribute(
      "href",
      "/es/como-trabajo",
    );
  });

  test("the closing leads to contact", async ({ page }) => {
    await page.goto("/es");
    const closing = page.locator("#cierre");
    await expect(closing.getByRole("heading", { level: 2 })).toHaveText(
      `${es.home.closing.title} ${es.home.closing.accent}`,
    );
    await expect(closing.getByRole("link", { name: es.home.closing.cta })).toHaveAttribute(
      "href",
      "/es/contacto",
    );
    await expect(closing.locator('a[href^="mailto:"]')).toHaveCount(1);
  });

  test("keeps a single h1 and no accessibility violations", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  test("has no horizontal scroll on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});
