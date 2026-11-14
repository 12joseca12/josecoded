import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { homeProjectSlugs } from "../../src/config/home";
import AxeBuilder from "./support/axe";

interface Messages {
  home: {
    services: { title: string; hiringCta: string };
    projects: { title: string; accent: string; all: string };
    stack: { title: string };
    closing: { title: string; accent: string; cta: string };
    tiers: { accent: string };
  };
  offersPage: {
    compare: { tabWeb: string; tabApp: string; notSureLink: string };
    tiers: Record<
      "web-presencia" | "web-negocio" | "web-plataforma" | "app-primera-version" | "app-producto",
      { name: string }
    >;
  };
  services: {
    ways: { project: { title: string; cta: string } };
    bento: {
      needs: Record<"contratacion" | "project" | "freelance", { title: string }>;
      proof: { stack: string };
    };
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
    await expect(section.getByRole("link", { name: es.home.services.hiringCta })).toHaveAttribute(
      "href",
      "/es/servicios#contratacion",
    );
    await expect(page.locator("#como-trabajo")).toHaveCount(0);
    await expect(section).not.toContainText("€");
  });

  test("shows one card per configured project, each linking to its case", async ({ page }) => {
    await page.goto("/es");
    const section = page.getByRole("region", {
      name: `${es.home.projects.title} ${es.home.projects.accent}`,
    });
    await expect(section).toBeVisible();
    await expect(section.getByRole("article")).toHaveCount(homeProjectSlugs.length);
    for (const slug of homeProjectSlugs) {
      await expect(section.locator(`a[href="/es/proyectos/${slug}"]`)).toHaveCount(1);
    }
    await expect(section.getByRole("link", { name: es.home.projects.all })).toHaveAttribute(
      "href",
      "/es/proyectos",
    );
  });

  test("the tier teaser lists every level without invented prices and links to the recommender", async ({
    page,
  }) => {
    await page.goto("/es");
    const { project } = es.services.ways;
    const section = page.getByRole("region", {
      name: `${project.title} ${es.home.tiers.accent}`,
    });
    await expect(section).toBeVisible();
    const web = section.getByRole("region", { name: es.offersPage.compare.tabWeb });
    const app = section.getByRole("region", { name: es.offersPage.compare.tabApp });
    for (const slug of ["web-presencia", "web-negocio", "web-plataforma"] as const) {
      await expect(web.getByText(es.offersPage.tiers[slug].name, { exact: true })).toBeVisible();
    }
    for (const slug of ["app-primera-version", "app-producto"] as const) {
      await expect(app.getByText(es.offersPage.tiers[slug].name, { exact: true })).toBeVisible();
    }
    await expect(section).not.toContainText("€");
    await expect(section.getByRole("link", { name: project.cta })).toHaveAttribute(
      "href",
      "/es/servicios/a-medida",
    );
    const finder = section.getByRole("link", { name: es.offersPage.compare.notSureLink });
    await expect(finder).toHaveAttribute("href", "/es/servicios/a-medida#recomendador");
    await finder.click();
    await expect(page).toHaveURL(/\/es\/servicios\/a-medida#recomendador/);
    await expect(page.locator("#recomendador")).toBeVisible();
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
