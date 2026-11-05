import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Messages {
  crm: { overview: Overview };
}

interface Overview {
  title: string;
  today: { title: string; viewOverdue: string; viewLeads: string };
  cells: {
    inbox: string;
    overdue: string;
    dueToday: string;
    stages: Record<"new" | "contacted" | "meeting" | "proposal", string>;
    unavailable: { title: string };
    error: { title: string; retry: string };
  };
  pipeline: { title: string };
  due: { title: string; listLabel: string; overdue: string };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.crm.overview;

const path = "/es/crm";
const next = "?next=%2Fes%2Fcrm";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.51" } });

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

async function setCounters(page: Page, mode: "data" | "error" | "missing") {
  await page.request.post(`${mock}/__auth/counters-mode?tag=${tag.value}`, { data: { mode } });
}

async function openAsCloser(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: width > 600 ? 900 : 812 });
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm$/);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
}

function cell(page: Page, label: string) {
  return page.getByRole("listitem").filter({ hasText: label });
}

test("a closer sees today's counters, the pipeline and the overdue steps", async ({ page }) => {
  await openAsCloser(page);
  await expect(cell(page, text.cells.overdue)).toContainText("1");
  await expect(cell(page, text.cells.inbox)).toContainText("1");
  await expect(cell(page, text.cells.stages.proposal)).toContainText("1");
  await expect(cell(page, text.cells.stages.contacted)).toContainText("0");
  const due = page.getByRole("list", { name: text.due.listLabel });
  await expect(due.getByRole("listitem")).toHaveCount(1);
  await expect(due).toContainText(text.due.overdue);
  await expectClean(page);
});

test("the single accent action goes to the overdue contacts", async ({ page }) => {
  await openAsCloser(page);
  await page.getByRole("link", { name: text.today.viewOverdue }).click();
  await expect(page).toHaveURL(/\/es\/crm\/contactos\?due=1$/);
});

test("a counter links to its filtered list", async ({ page }) => {
  await openAsCloser(page);
  await cell(page, text.cells.stages.proposal).getByRole("link").click();
  await expect(page).toHaveURL(/\/es\/crm\/contactos\?stage=proposal$/);
});

test("the overview fits a phone without clean-up errors", async ({ page }) => {
  await openAsCloser(page, 375);
  await expect(cell(page, text.cells.overdue)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await expectClean(page);
});

test("missing counters degrade to a notice and the steps still load", async ({ page }) => {
  await setCounters(page, "missing");
  await openAsCloser(page);
  await expect(page.getByRole("heading", { name: text.cells.unavailable.title })).toBeVisible();
  await expect(page.getByRole("list", { name: text.due.listLabel })).toBeVisible();
  await expectClean(page);
});

test("a failing counters query is explained and retries", async ({ page }) => {
  await setCounters(page, "error");
  await openAsCloser(page);
  await expect(page.getByText(text.cells.error.title)).toBeVisible();
  await setCounters(page, "data");
  await page.getByRole("button", { name: text.cells.error.retry }).click();
  await expect(cell(page, text.cells.overdue)).toContainText("1");
});

test("an admin reaches the overview too", async ({ page }) => {
  await signInAdmin(page, tag, next);
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await expect(cell(page, text.cells.overdue)).toBeVisible();
});
