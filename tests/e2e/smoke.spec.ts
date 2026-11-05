import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  meta: { titleTemplate: string };
  home: { metaTitle: string; hero: { title: string; accent: string } };
  dev: { ui: { title: string } };
};

test("/es renders the translated title and passes axe", async ({ page }) => {
  await page.goto("/es");
  await expect(page).toHaveTitle(es.meta.titleTemplate.replace("%s", es.home.metaTitle));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${es.home.hero.title} ${es.home.hero.accent}`,
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("/es/dev/ui catalog passes axe", async ({ page }) => {
  await page.goto("/es/dev/ui");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(es.dev.ui.title);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("/ redirects to /es", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
});

test("/en is not published", async ({ request }) => {
  const response = await request.get("/en");
  expect(response.status()).toBe(404);
});

test("axe reports an unnamed role=img", async ({ page }) => {
  await page.setContent(
    '<!doctype html><html lang="es"><head><title>x</title></head><body><main><div role="img"></div></main></body></html>',
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => violation.id)).toContain("role-img-alt");
});
