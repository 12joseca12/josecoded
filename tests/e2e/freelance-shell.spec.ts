import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import { staffNav } from "../../src/lib/staff/nav";
import AxeBuilder from "./support/axe";
import {
  mockOrigin as mock,
  signInClient,
  signInCloser,
  signInFreelance,
  type Tag,
  withTag,
} from "./support/staff";

interface FreelanceMessages {
  freelance: {
    nav: Record<string, string>;
    empty: { title: string; text: string; noneOpenTitle: string };
    projects: { title: string; open: string; closedTitle: string; closedPill: string };
    home: { title: string };
  };
  errors: { notFound: { title: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as FreelanceMessages;
const { freelance } = es;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.42" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: mode });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("a freelance with projects sees the list on the home", async ({ page }) => {
  await setMode(page, { mode: "two" });
  await signInFreelance(page, tag);
  await expect(page).toHaveURL(/\/es\/freelance$/);
  await expect(page.getByRole("heading", { level: 1, name: freelance.home.title })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Tienda de Carla" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Landing de la academia" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /Tienda de Carla/ })).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
  await expectClean(page);
});

test("a freelance without projects sees the empty state instead of a 404", async ({ page }) => {
  await signInFreelance(page, tag);
  await expect(page).toHaveURL(/\/es\/freelance$/);
  await expect(page.getByRole("heading", { level: 2, name: freelance.empty.title })).toBeVisible();
  await expect(page.getByText(freelance.empty.text)).toBeVisible();
  await expectClean(page);
});

test("the projects page separates open and closed projects", async ({ page }) => {
  await setMode(page, { mode: "history" });
  await signInFreelance(page, tag);
  await page.goto("/es/freelance/proyectos");
  await expect(
    page.getByRole("heading", { level: 1, name: freelance.projects.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: freelance.projects.open }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: freelance.projects.closedTitle }),
  ).toBeVisible();
  const closed = page.getByRole("region", { name: freelance.projects.closedTitle });
  await expect(closed.getByRole("heading", { name: "Prueba: landing cerrada" })).toBeVisible();
  await expect(closed.getByText(freelance.projects.closedPill, { exact: true })).toBeVisible();
  await expectClean(page);
});

test("only closed projects show the no open projects message on the home", async ({ page }) => {
  await setMode(page, { mode: "closedOnly" });
  await signInFreelance(page, tag);
  await expect(
    page.getByRole("heading", { level: 2, name: freelance.empty.noneOpenTitle }),
  ).toBeVisible();
});

test("the nav lists the registry and only links the shipped screens", async ({ page }) => {
  await signInFreelance(page, tag);
  const nav = page.getByRole("navigation").first();
  for (const entry of staffNav.freelance.filter((item) => item.ready)) {
    await expect(nav.getByRole("link", { name: freelance.nav[entry.key] ?? "" })).toBeVisible();
  }
  await expect(page.locator("[data-zone='freelance']")).toBeVisible();
});

test("a failing project query shows the retry state and keeps the shell", async ({ page }) => {
  await setMode(page, { mode: "one", error: "projects" });
  await signInFreelance(page, tag);
  await expect(page.getByRole("button", { name: "Reintentar" }).first()).toBeVisible();
  await expect(page.locator("[data-zone='freelance']")).toBeVisible();
});

test("a closer and a client get the 404 page on the freelance zone", async ({ page }) => {
  await signInCloser(page, tag);
  const closer = await page.goto("/es/freelance");
  expect(closer?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
});

test("a client gets the 404 page on the freelance zone", async ({ page }) => {
  await signInClient(page, tag);
  const response = await page.goto("/es/freelance");
  expect(response?.status()).toBe(404);
});

test("the home has no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await setMode(page, { mode: "two" });
  await signInFreelance(page, tag);
  await expect(page.getByRole("heading", { level: 3, name: "Tienda de Carla" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
