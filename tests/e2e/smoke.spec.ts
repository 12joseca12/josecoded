import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  meta: { title: string };
  home: { name: string };
};

test("/es renders the translated title and passes axe", async ({ page }) => {
  await page.goto("/es");
  await expect(page).toHaveTitle(es.meta.title);
  await expect(page.getByRole("main")).toHaveText(es.home.name);
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
