import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import {
  mockOrigin as mock,
  signInAdmin,
  signInCloser,
  signInOtp,
  type Tag,
  totpCode,
  withTag,
} from "./support/staff";

interface SettingsMessages {
  auth: { totp: { enrollStart: string; codeLabel: string; verify: string } };
  crm: {
    nav: { settings: string };
    settings: {
      title: string;
      rates: { title: string; none: string; project: string; recurring: string };
    };
  };
  admin: {
    notifications: {
      telegram: {
        title: string;
        generate: string;
        open: string;
        check: string;
        unlink: string;
        confirmYes: string;
        done: { linked: string; unlinked: string };
      };
      rules: {
        region: string;
        channels: Record<"telegram" | "email" | "bell", string>;
        events: Record<string, string>;
        saved: string;
      };
    };
  };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as SettingsMessages;
const { telegram, rules } = es.admin.notifications;
const { settings } = es.crm;
const closerId = "00000000-0000-4000-8000-0000000000c1";

interface Call {
  name: string;
  args?: Record<string, unknown>;
}

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.80" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function calls(page: Page, name: string): Promise<Call[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const all = (await response.json()) as { notifications: Call[] };
  return all.notifications.filter((call) => call.name === name);
}

async function openAsCloser(page: Page) {
  await signInCloser(page, tag, "?next=%2Fes%2Fcrm%2Fajustes");
  await expect(page).toHaveURL(/\/es\/crm\/ajustes$/);
  await expect(page.getByRole("heading", { level: 1, name: settings.title })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function switchOf(page: Page, event: string, channel: "telegram" | "email" | "bell") {
  return page.getByRole("switch", {
    name: `${rules.events[event] ?? event}: ${rules.channels[channel]}`,
    exact: true,
  });
}

test("the settings open from the CRM nav and a closer sees the rate, the card and four events", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag);
  await page.goto("/es/crm");
  const nav = page.getByRole("navigation", { name: "CRM" });
  await nav.getByRole("link", { name: es.crm.nav.settings }).click();
  await expect(page).toHaveURL(/\/es\/crm\/ajustes$/);
  await expect(nav.getByRole("link", { name: es.crm.nav.settings })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { level: 1, name: settings.title })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: telegram.title })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(12);
  await expect(switchOf(page, "lead_claimed", "email")).toBeChecked();
  await expect(switchOf(page, "job_failed", "email")).toHaveCount(0);

  const rate = page.getByRole("region", { name: settings.rates.title });
  await expect(rate.getByText("10 %")).toBeVisible();
  await expect(rate.getByText("7,5 %")).toBeVisible();
  await expectClean(page);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByRole("region", { name: rules.region })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});

test("an anonymous visitor is sent to log in", async ({ page }) => {
  await page.goto("/es/crm/ajustes");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fcrm%2Fajustes$/);
});

test("the admin sees every event and no rate", async ({ page }) => {
  await signInAdmin(page, tag, "?next=%2Fes%2Fcrm%2Fajustes");
  await expect(page.getByRole("heading", { level: 1, name: settings.title })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(30);
  await expect(page.getByRole("region", { name: settings.rates.title })).toHaveCount(0);
});

test("a closer without a rate is told so", async ({ page }) => {
  await signInOtp(page, tag, "dani@example.com", "?next=%2Fes%2Fcrm%2Fajustes");
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  await page.getByRole("button", { name: es.auth.totp.enrollStart }).click();
  await page.getByLabel(es.auth.totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: es.auth.totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/crm\/ajustes$/, { timeout: 20_000 });
  const rate = page.getByRole("region", { name: settings.rates.title });
  await expect(rate.getByText(settings.rates.none)).toBeVisible();
});

test("a closer changes an alert and it is saved for that closer", async ({ page }) => {
  await openAsCloser(page);
  const telegramSwitch = switchOf(page, "commission_accrued", "telegram");
  await telegramSwitch.focus();
  await page.keyboard.press("Space");
  await expect(telegramSwitch).not.toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: rules.saved })).toBeVisible();
  expect(await calls(page, "set_notification_pref")).toMatchObject([
    {
      args: { p_event: "commission_accrued", p_channel: "telegram", p_enabled: false },
    },
  ]);
  await page.reload();
  await expect(switchOf(page, "commission_accrued", "telegram")).not.toBeChecked();
});

test("a closer links Telegram with the shared card and can unlink it", async ({ page }) => {
  await openAsCloser(page);
  const card = page.getByRole("region", { name: telegram.title });
  await card.getByRole("button", { name: telegram.generate }).click();
  const code = (await card.locator("[translate='no']").textContent()) ?? "";
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
  await expect(card.getByRole("link", { name: telegram.open })).toHaveAttribute(
    "href",
    `https://t.me/josecoded_test_bot?start=${code}`,
  );

  await page.request.post(`${mock}/__auth/telegram-confirm?tag=${tag.value}`, {
    data: { userId: closerId, chatId: 5151 },
  });
  await card.getByRole("button", { name: telegram.check }).click();
  await expect(card.getByRole("status")).toHaveText(telegram.done.linked);

  await card.getByRole("button", { name: telegram.unlink }).click();
  await card.getByRole("button", { name: telegram.confirmYes }).click();
  await expect(card.getByRole("status")).toHaveText(telegram.done.unlinked);
  await expectClean(page);
});
