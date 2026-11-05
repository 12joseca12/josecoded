import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Messages {
  common: { responseTime: string };
  crm: { start: Start };
}

interface Start {
  title: string;
  stepsLabel: string;
  steps: Record<"telegram" | "rates" | "leads" | "contact" | "nextStep", { title: string }>;
  rules: { title: string; response: string };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.crm.start;

const next = "?next=%2Fes%2Fcrm%2Fempezar";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.52" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  await expect(page).toHaveTitle(/josecoded/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("a closer sees the five steps and what not to promise", async ({ page }) => {
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/empezar$/);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  const steps = page.getByRole("list", { name: text.stepsLabel });
  await expect(steps.getByRole("listitem")).toHaveCount(5);
  await expect(steps).toContainText(text.steps.rates.title);
  await expect(page.getByRole("heading", { name: text.rules.title })).toBeVisible();
  await expect(
    page.getByText(text.rules.response.replace("{time}", es.common.responseTime)),
  ).toBeVisible();
  await expectClean(page);
});

test("a step opens the screen it names", async ({ page }) => {
  await signInCloser(page, tag, next);
  const steps = page.getByRole("list", { name: text.stepsLabel });
  await steps
    .getByRole("listitem")
    .filter({ hasText: text.steps.leads.title })
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/\/es\/crm\/interesados$/);
});

test("the page fits a phone without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInCloser(page, tag, next);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await expectClean(page);
});

test("an admin has no commission step", async ({ page }) => {
  await signInAdmin(page, tag, next);
  await page.goto("/es/crm/empezar");
  const steps = page.getByRole("list", { name: text.stepsLabel });
  await expect(steps.getByRole("listitem")).toHaveCount(4);
  await expect(steps).not.toContainText(text.steps.rates.title);
});
