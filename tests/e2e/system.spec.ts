import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import {
  mockOrigin as mock,
  signInAdmin as signInStaffAdmin,
  signInCloser,
  type Tag,
  withTag,
} from "./support/staff";

interface Notice {
  title: string;
  text: string;
  retry: string;
}

interface SystemMessages {
  admin: {
    nav: { system: string };
    system: {
      title: string;
      settings: {
        region: string;
        unavailable: Notice;
        error: Notice;
        groups: Record<string, { title: string }>;
        items: Record<string, { name: string }>;
        row: {
          on: string;
          off: string;
          save: string;
          saved: string;
          wired: string;
          notWired: string;
          maintenanceUntil: string;
          errors: Record<"invalid" | "error", string>;
        };
      };
      omen: {
        title: string;
        tone: Record<"live" | "slow" | "down" | "none", string>;
        bandNone: string;
        unavailable: string;
        error: Notice;
        queue: Record<"queued" | "failed", string>;
        version: string;
      };
      jobs: {
        title: string;
        region: string;
        filterLabel: string;
        filters: Record<"all" | "failed" | "queued", string>;
        status: Record<"queued" | "failed" | "cancelled", string>;
        kinds: Record<"radar_scan" | "radar_draft" | "notify_send", string>;
        errorMore: string;
        retry: string;
        cancel: string;
        confirmRetry: string;
        confirmCancel: string;
        confirmYes: string;
        confirmNo: string;
        done: Record<"retry" | "cancel", string>;
        errors: Record<"stale" | "error", string>;
        empty: { title: string };
        emptyFiltered: { title: string };
        unavailable: { title: string };
        error: Notice;
      };
    };
  };
}

const es = (JSON.parse(readFileSync("messages/es.json", "utf8")) as SystemMessages).admin;
const { settings, omen, jobs } = es.system;

interface SystemCall {
  name: string;
  args?: Record<string, unknown>;
  level: string | null;
}

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.77" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, string>) {
  await page.request.post(`${mock}/__auth/system-mode?tag=${tag.value}`, { data: mode });
}

async function systemCalls(page: Page, name: string): Promise<SystemCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const calls = (await response.json()) as { system: SystemCall[] };
  return calls.system.filter((call) => call.name === name);
}

async function openSystem(page: Page, mode: Record<string, string> = {}) {
  await signInStaffAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fsistema");
  await expect(page).toHaveURL(/\/es\/admin\/sistema$/);
  if (Object.keys(mode).length > 0) {
    await setMode(page, mode);
    await page.reload();
  }
  await expect(page.getByRole("heading", { level: 1, name: es.system.title })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function alertOf(page: Page, title: string) {
  return page.getByRole("alert").filter({ hasText: title });
}

function switchOf(page: Page, key: string) {
  return page.getByRole("switch", { name: settings.items[key]?.name ?? key, exact: true });
}

function jobRow(page: Page, kind: string) {
  return page.getByRole("row").filter({ hasText: kind });
}

test("the system page opens from the admin nav and passes axe at 1440 and 375", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInStaffAdmin(page, tag);
  await page.goto("/es/admin");
  const nav = page.getByRole("navigation", { name: "Administración" });
  await nav.getByRole("link", { name: es.nav.system }).click();
  await expect(page).toHaveURL(/\/es\/admin\/sistema$/);
  await expect(nav.getByRole("link", { name: es.nav.system })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { level: 1, name: es.system.title })).toBeVisible();
  for (const group of Object.values(settings.groups)) {
    await expect(page.getByRole("heading", { level: 2, name: group.title })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: jobs.region })).toBeVisible();
  await expectClean(page);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: es.system.title })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("a closer gets a 404 and an anonymous visitor is sent to log in", async ({ page }) => {
  await page.goto("/es/admin/sistema");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fadmin%2Fsistema$/);
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/sistema");
  expect(response?.status()).toBe(404);
});

test("Omen shows no signal honestly before the first heartbeat", async ({ page }) => {
  await openSystem(page);
  const section = page.getByRole("region", { name: omen.title });
  await expect(section.getByText(omen.tone.none)).toBeVisible();
  await expect(section.getByText(omen.bandNone)).toBeVisible();
  await expect(section.getByText(omen.queue.failed)).toBeVisible();
});

test("Omen turns online, delayed or down with the age of the heartbeat", async ({ page }) => {
  await openSystem(page, { omen: "live" });
  const section = page.getByRole("region", { name: omen.title });
  await expect(section.getByText(omen.tone.live)).toBeVisible();
  await expect(section.getByText(omen.bandNone)).toHaveCount(0);
  await expect(section.getByText("1.4.2")).toBeVisible();
  await expect(section.getByText("qwen2.5, llama3.2")).toBeVisible();
  await expectClean(page);

  await setMode(page, { omen: "slow" });
  await page.reload();
  await expect(section.getByText(omen.tone.slow)).toBeVisible();

  await setMode(page, { omen: "down" });
  await page.reload();
  await expect(section.getByText(omen.tone.down)).toBeVisible();
  await expect(section.getByText(/Omen no responde desde hace \d+ min/)).toBeVisible();
  await expectClean(page);
});

test("Omen explains a heartbeat log that is not applied yet and a failed read", async ({
  page,
}) => {
  await openSystem(page, { omen: "missing" });
  await expect(page.getByText(omen.unavailable)).toBeVisible();
  await expect(page.getByText(omen.tone.none)).toBeVisible();

  await setMode(page, { omen: "error" });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: omen.error.title })).toBeVisible();
  await expectClean(page);

  await setMode(page, { omen: "none" });
  await alertOf(page, omen.error.title).getByRole("button", { name: omen.error.retry }).click();
  await expect(page.getByText(omen.tone.none)).toBeVisible();
});

test("the switches show what is stored and say which ones the site already reads", async ({
  page,
}) => {
  await openSystem(page);
  await expect(switchOf(page, "blog")).toBeChecked();
  await expect(switchOf(page, "public_chat")).not.toBeChecked();
  await expect(switchOf(page, "google_sign_in")).not.toBeChecked();
  const google = page
    .getByRole("listitem")
    .filter({ hasText: settings.items.google_sign_in?.name ?? "" });
  await expect(google.getByText(settings.row.wired, { exact: true })).toBeVisible();
  const blog = page.getByRole("listitem").filter({ hasText: /^Blog/ });
  await expect(blog.getByText(settings.row.notWired)).toBeVisible();
});

test("an admin turns a switch off with the keyboard and the change is saved at once", async ({
  page,
}) => {
  await openSystem(page);
  const blog = switchOf(page, "blog");
  await blog.focus();
  await page.keyboard.press("Space");
  await expect(blog).not.toBeChecked();
  const row = page.getByRole("listitem").filter({ hasText: /^Blog/ });
  await expect(row.getByRole("status")).toHaveText(settings.row.saved);
  const calls = await systemCalls(page, "set_setting");
  expect(calls).toEqual([
    { name: "set_setting", args: { p_key: "blog", p_value: false }, level: "aal2" },
  ]);
  await page.reload();
  await expect(switchOf(page, "blog")).not.toBeChecked();
});

test("a refused or failed save keeps the switch where it was and says so", async ({ page }) => {
  await openSystem(page, { save: "error" });
  const search = switchOf(page, "search");
  await search.click();
  const row = page.getByRole("listitem").filter({ hasText: /^Buscador/ });
  await expect(row.getByRole("alert")).toHaveText(settings.row.errors.error);
  await expect(search).not.toBeChecked();

  await setMode(page, { save: "invalid" });
  await search.click();
  await expect(row.getByRole("alert")).toHaveText(settings.row.errors.invalid);
  await expect(search).not.toBeChecked();
});

test("a number setting is validated, saved and reported", async ({ page }) => {
  await openSystem(page);
  const row = page.getByRole("listitem").filter({ hasText: /^Espera de Nexo/ });
  const field = row.getByRole("spinbutton");
  await expect(field).toHaveValue("10");
  await field.fill("");
  await row.getByRole("button", { name: settings.row.save }).click();
  await expect(row.getByRole("alert")).toHaveText(settings.row.errors.invalid);
  expect(await systemCalls(page, "set_setting")).toHaveLength(0);

  await field.fill("15");
  await row.getByRole("button", { name: settings.row.save }).click();
  await expect(row.getByRole("status")).toHaveText(settings.row.saved);
  const calls = await systemCalls(page, "set_setting");
  expect(calls.map((call) => call.args)).toEqual([{ p_key: "nexo.reply_delay_min", p_value: 15 }]);
});

test("maintenance saves its switch and an end time in Madrid time", async ({ page }) => {
  await openSystem(page);
  const row = page.getByRole("listitem").filter({ hasText: /^Modo mantenimiento/ });
  await row.getByLabel(settings.row.maintenanceUntil).fill("2026-11-06T08:00");
  await row.getByRole("button", { name: settings.row.save }).click();
  await expect(row.getByRole("status")).toHaveText(settings.row.saved);
  await switchOf(page, "maintenance").click();
  await expect(switchOf(page, "maintenance")).toBeChecked();
  const calls = await systemCalls(page, "set_setting");
  expect(calls.map((call) => call.args)).toEqual([
    { p_key: "maintenance", p_value: { on: false, until: "2026-11-06T08:00:00+01:00" } },
    { p_key: "maintenance", p_value: { on: true, until: "2026-11-06T08:00:00+01:00" } },
  ]);
});

test("a cadence select and a month field save their value", async ({ page }) => {
  await openSystem(page);
  const cadence = page.getByRole("combobox", { name: "Cadencia de liquidación" });
  await cadence.selectOption("weekly");
  const month = page.getByLabel("Próximo mes libre");
  await month.fill("2027-01");
  await page
    .getByRole("listitem")
    .filter({ hasText: /^Próximo mes libre/ })
    .getByRole("button", { name: settings.row.save })
    .click();
  await expect
    .poll(async () => (await systemCalls(page, "set_setting")).map((call) => call.args))
    .toEqual([
      { p_key: "payout.default_cadence", p_value: "weekly" },
      { p_key: "availability.next_project_month", p_value: "2027-01" },
    ]);
});

test("settings that are not in the database yet are read only and explained", async ({ page }) => {
  await openSystem(page, { settings: "missing" });
  await expect(page.getByRole("heading", { name: settings.unavailable.title })).toBeVisible();
  await expect(switchOf(page, "blog")).toBeDisabled();
  await expect(page.getByRole("button", { name: settings.row.save })).toHaveCount(0);
  await expectClean(page);
});

test("the settings have an error state with a retry", async ({ page }) => {
  await openSystem(page, { settings: "error" });
  await expect(page.getByRole("alert").filter({ hasText: settings.error.title })).toBeVisible();
  await setMode(page, { settings: "data" });
  await alertOf(page, settings.error.title)
    .getByRole("button", { name: settings.error.retry })
    .click();
  await expect(switchOf(page, "blog")).toBeVisible();
});

test("the job table lists the queue and filters by status in the URL", async ({ page }) => {
  await openSystem(page);
  const table = page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(jobRow(page, jobs.kinds.notify_send)).toContainText(jobs.status.queued);
  await expect(jobRow(page, jobs.kinds.radar_scan)).toContainText("3/3");
  await expect(jobRow(page, jobs.kinds.radar_scan).getByText(jobs.errorMore)).toBeVisible();
  await expectClean(page);

  const filters = page.getByRole("navigation", { name: jobs.filterLabel });
  await expect(filters.getByRole("link", { name: jobs.filters.all })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await filters.getByRole("link", { name: jobs.filters.failed }).click();
  await expect(page).toHaveURL(/\/es\/admin\/sistema\?estado=failed$/);
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(2);
  await expect(filters.getByRole("link", { name: jobs.filters.failed })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const calls = await systemCalls(page, "admin_jobs");
  expect(calls.at(-1)?.args).toEqual({ p_limit: 100, p_status: "failed" });
});

test("a failed job is retried after a confirmation", async ({ page }) => {
  await openSystem(page, { jobs: "data" });
  const row = jobRow(page, jobs.kinds.radar_draft);
  await row.getByRole("button", { name: jobs.retry }).click();
  await expect(row.getByText(jobs.confirmRetry)).toBeVisible();
  await expect(row.getByRole("button", { name: jobs.confirmYes })).toBeFocused();
  expect(await systemCalls(page, "retry_job")).toHaveLength(0);

  await row.getByRole("button", { name: jobs.confirmNo }).click();
  await expect(row.getByRole("button", { name: jobs.retry })).toBeFocused();
  expect(await systemCalls(page, "retry_job")).toHaveLength(0);

  await row.getByRole("button", { name: jobs.retry }).click();
  await row.getByRole("button", { name: jobs.confirmYes }).click();
  await expect(page.getByRole("status").filter({ hasText: jobs.done.retry })).toBeVisible();
  await expect(row).toContainText(jobs.status.queued);
  const calls = await systemCalls(page, "retry_job");
  expect(calls.map((call) => call.args)).toEqual([
    { p_id: "50000000-0000-4000-8000-000000000005" },
  ]);
});

test("a queued job is cancelled after a confirmation and one that changed is reported", async ({
  page,
}) => {
  await openSystem(page);
  const row = jobRow(page, jobs.kinds.notify_send);
  await row.getByRole("button", { name: jobs.cancel }).click();
  await expect(row.getByText(jobs.confirmCancel)).toBeVisible();
  await row.getByRole("button", { name: jobs.confirmYes }).click();
  await expect(page.getByRole("status").filter({ hasText: jobs.done.cancel })).toBeVisible();
  await expect(row).toContainText(jobs.status.cancelled);

  await setMode(page, { jobAction: "stale" });
  const failed = jobRow(page, jobs.kinds.radar_scan);
  await failed.getByRole("button", { name: jobs.retry }).click();
  await failed.getByRole("button", { name: jobs.confirmYes }).click();
  await expect(failed.getByRole("alert")).toHaveText(jobs.errors.stale);
});

test("the job table has empty, filtered empty, error and not applied states", async ({ page }) => {
  await openSystem(page, { jobs: "empty" });
  await expect(page.getByRole("heading", { name: jobs.empty.title })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expectClean(page);

  await page.goto("/es/admin/sistema?estado=failed");
  await expect(page.getByRole("heading", { name: jobs.emptyFiltered.title })).toBeVisible();

  await setMode(page, { jobs: "missing" });
  await page.reload();
  await expect(page.getByRole("heading", { name: jobs.unavailable.title })).toBeVisible();

  await setMode(page, { jobs: "error" });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: jobs.error.title })).toBeVisible();
  await expectClean(page);

  await setMode(page, { jobs: "data" });
  await alertOf(page, jobs.error.title).getByRole("button", { name: jobs.error.retry }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("an unknown status in the URL falls back to the whole list", async ({ page }) => {
  await openSystem(page);
  await page.goto("/es/admin/sistema?estado=bogus");
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(5);
});
