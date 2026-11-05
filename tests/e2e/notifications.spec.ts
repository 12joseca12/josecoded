import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Notice {
  title: string;
  text: string;
  retry: string;
}

interface NotificationMessages {
  admin: {
    nav: { notifications: string };
    notifications: {
      title: string;
      drainOff: { title: string };
      telegram: {
        title: string;
        unlinked: string;
        noBot: { title: string };
        generate: string;
        codeTitle: string;
        open: string;
        check: string;
        stillPending: string;
        unlink: string;
        confirmUnlink: string;
        confirmYes: string;
        confirmNo: string;
        done: { linked: string; unlinked: string };
        errors: Record<"error", string>;
        error: Notice;
        unavailable: { title: string };
      };
      rules: {
        region: string;
        channels: Record<"telegram" | "email" | "bell", string>;
        events: Record<string, string>;
        idle: string;
        saved: string;
        errors: Record<"error", string>;
        error: Notice;
        unavailable: { title: string };
      };
      test: {
        send: Record<"email" | "telegram", string>;
        done: Record<"email" | "telegram", string>;
        needsTelegram: string;
        errors: Record<"error", string>;
      };
    };
  };
}

const es = (JSON.parse(readFileSync("messages/es.json", "utf8")) as NotificationMessages).admin;
const { telegram, rules, test: sender } = es.notifications;
const live = process.env.E2E_OUTBOX_DRAIN === "on";
const adminId = "00000000-0000-4000-8000-0000000000a2";

interface Call {
  name: string;
  args?: Record<string, unknown>;
  level: string | null;
}

interface QueuedRow {
  channel: string;
  recipient: string;
  template: string;
  status: string;
}

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.78" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, string>) {
  await page.request.post(`${mock}/__auth/notifications-mode?tag=${tag.value}`, { data: mode });
}

async function calls(page: Page, name: string): Promise<Call[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const all = (await response.json()) as { notifications: Call[] };
  return all.notifications.filter((call) => call.name === name);
}

async function queue(page: Page): Promise<QueuedRow[]> {
  const response = await page.request.get(`${mock}/__auth/outbox?tag=${tag.value}`);
  return (await response.json()) as QueuedRow[];
}

async function linkFromBot(page: Page) {
  await page.request.post(`${mock}/__auth/telegram-confirm?tag=${tag.value}`, {
    data: { userId: adminId, chatId: 4242 },
  });
}

async function openPage(page: Page, mode: Record<string, string> = {}) {
  await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fnotificaciones");
  await expect(page).toHaveURL(/\/es\/admin\/notificaciones$/);
  if (Object.keys(mode).length > 0) {
    await setMode(page, mode);
    await page.reload();
  }
  await expect(page.getByRole("heading", { level: 1, name: es.notifications.title })).toBeVisible();
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

const sectionOf = (page: Page) => page.getByRole("region", { name: telegram.title });

test.describe("with the bot configured and sending off", () => {
  test.skip(live, "needs the default environment");

  test("the page opens from the admin nav and passes axe at 1440 and 375", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signInAdmin(page, tag);
    await page.goto("/es/admin");
    const nav = page.getByRole("navigation", { name: "Administración" });
    await nav.getByRole("link", { name: es.nav.notifications }).click();
    await expect(page).toHaveURL(/\/es\/admin\/notificaciones$/);
    await expect(nav.getByRole("link", { name: es.nav.notifications })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: es.notifications.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: es.notifications.drainOff.title }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: telegram.title })).toBeVisible();
    await expect(page.getByRole("region", { name: rules.region })).toBeVisible();
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

  test("a closer gets a 404 and an anonymous visitor is sent to log in", async ({ page }) => {
    await page.goto("/es/admin/notificaciones");
    await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fadmin%2Fnotificaciones$/);
    await signInCloser(page, tag);
    const response = await page.goto("/es/admin/notificaciones");
    expect(response?.status()).toBe(404);
  });

  test("the matrix shows every channel on by default and flags the event without effect", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.getByRole("switch")).toHaveCount(30);
    await expect(switchOf(page, "lead_new", "telegram")).toBeChecked();
    await expect(switchOf(page, "omen_down", "bell")).toBeChecked();
    const row = page.getByRole("row").filter({ hasText: rules.events.message_new ?? "" });
    await expect(row.getByText(rules.idle)).toBeVisible();
  });

  test("a switch is saved at once from the keyboard and survives a reload", async ({ page }) => {
    await openPage(page);
    const email = switchOf(page, "lead_new", "email");
    await email.focus();
    await page.keyboard.press("Space");
    await expect(email).not.toBeChecked();
    await expect(page.getByRole("status").filter({ hasText: rules.saved })).toBeVisible();
    expect(await calls(page, "set_notification_pref")).toEqual([
      {
        name: "set_notification_pref",
        args: { p_event: "lead_new", p_channel: "email", p_enabled: false },
        level: "aal2",
      },
    ]);
    await page.reload();
    await expect(switchOf(page, "lead_new", "email")).not.toBeChecked();
    await expect(switchOf(page, "lead_new", "telegram")).toBeChecked();
  });

  test("a failed save puts the switch back and says so", async ({ page }) => {
    await openPage(page, { action: "error" });
    const bell = switchOf(page, "job_failed", "bell");
    await bell.click();
    await expect(page.getByRole("alert").filter({ hasText: rules.errors.error })).toBeVisible();
    await expect(bell).toBeChecked();
  });

  test("the rules have an error state with a retry and a not applied state", async ({ page }) => {
    await openPage(page, { prefs: "error" });
    const alert = page.getByRole("alert").filter({ hasText: rules.error.title });
    await expect(alert).toBeVisible();
    await expectClean(page);
    await setMode(page, { prefs: "data" });
    await alert.getByRole("button", { name: rules.error.retry }).click();
    await expect(page.getByRole("region", { name: rules.region })).toBeVisible();

    await setMode(page, { prefs: "missing" });
    await page.reload();
    await expect(page.getByRole("heading", { name: rules.unavailable.title })).toBeVisible();
  });

  test("Telegram is linked with a code, checked, and unlinked after a confirmation", async ({
    page,
  }) => {
    await openPage(page);
    const card = sectionOf(page);
    await expect(card.getByText(telegram.unlinked)).toBeVisible();
    await card.getByRole("button", { name: telegram.generate }).click();
    await expect(card.getByText(telegram.codeTitle)).toBeVisible();
    const code = (await card.locator("[translate='no']").textContent()) ?? "";
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    await expect(card.getByRole("link", { name: telegram.open })).toHaveAttribute(
      "href",
      `https://t.me/josecoded_test_bot?start=${code}`,
    );
    await expectClean(page);

    await card.getByRole("button", { name: telegram.check }).click();
    await expect(card.getByText(telegram.stillPending)).toBeVisible();
    await expect(card.getByRole("button", { name: telegram.check })).toBeEnabled();

    await linkFromBot(page);
    await card.getByRole("button", { name: telegram.check }).click();
    await expect(card.getByRole("status")).toHaveText(telegram.done.linked);
    await expect(card.getByText(/^Vinculado el /)).toBeVisible();
    await expect(card.getByText(telegram.codeTitle)).toHaveCount(0);

    const unlink = card.getByRole("button", { name: telegram.unlink });
    await unlink.click();
    await expect(card.getByText(telegram.confirmUnlink)).toBeVisible();
    await expect(card.getByRole("button", { name: telegram.confirmYes })).toBeFocused();
    await card.getByRole("button", { name: telegram.confirmNo }).click();
    await expect(unlink).toBeFocused();
    expect(await calls(page, "telegram_unlink")).toHaveLength(0);

    await unlink.click();
    await card.getByRole("button", { name: telegram.confirmYes }).click();
    await expect(card.getByRole("status")).toHaveText(telegram.done.unlinked);
    await expect(card.getByText(telegram.unlinked)).toBeVisible();
    expect(await calls(page, "telegram_unlink")).toHaveLength(1);
  });

  test("a pending code is still there after a reload", async ({ page }) => {
    await openPage(page);
    const card = sectionOf(page);
    await card.getByRole("button", { name: telegram.generate }).click();
    const code = (await card.locator("[translate='no']").textContent()) ?? "";
    await page.reload();
    await expect(card.locator("[translate='no']")).toHaveText(code);
  });

  test("a failed code generation is reported", async ({ page }) => {
    await openPage(page, { action: "error" });
    const card = sectionOf(page);
    await card.getByRole("button", { name: telegram.generate }).click();
    await expect(card.getByRole("alert")).toHaveText(telegram.errors.error);
    await expect(card.getByRole("button", { name: telegram.generate })).toBeEnabled();
  });

  test("the Telegram card has an error state with a retry and a not applied state", async ({
    page,
  }) => {
    await openPage(page, { status: "error" });
    const alert = page.getByRole("alert").filter({ hasText: telegram.error.title });
    await expect(alert).toBeVisible();
    await setMode(page, { status: "data" });
    await alert.getByRole("button", { name: telegram.error.retry }).click();
    await expect(sectionOf(page)).toBeVisible();

    await setMode(page, { status: "missing" });
    await page.reload();
    await expect(page.getByRole("heading", { name: telegram.unavailable.title })).toBeVisible();
  });

  test("a test email is queued and stays queued while sending is off", async ({ page }) => {
    await openPage(page);
    await page.getByRole("button", { name: sender.send.email }).click();
    await expect(page.getByRole("status").filter({ hasText: sender.done.email })).toBeVisible();
    const rows = await queue(page);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ channel: "email", template: "test", status: "queued" });
    expect(rows[0]?.recipient).toContain(`+${tag.value}@`);
  });

  test("the Telegram test needs a linked chat and then queues for it", async ({ page }) => {
    await openPage(page);
    const button = page.getByRole("button", { name: sender.send.telegram });
    await expect(button).toBeDisabled();
    await expect(page.getByText(sender.needsTelegram).first()).toBeVisible();

    await linkFromBot(page);
    await page.reload();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole("status").filter({ hasText: sender.done.telegram })).toBeVisible();
    const rows = await queue(page);
    expect(rows[0]).toMatchObject({ channel: "telegram", recipient: "4242", template: "test" });
  });

  test("a failed test is reported", async ({ page }) => {
    await openPage(page, { action: "error" });
    await page.getByRole("button", { name: sender.send.email }).click();
    await expect(page.getByRole("alert").filter({ hasText: sender.errors.error })).toBeVisible();
    expect(await queue(page)).toHaveLength(0);
  });
});

test.describe("with sending on and no bot configured", () => {
  test.skip(!live, "needs E2E_OUTBOX_DRAIN=on");

  test("the card explains what is missing and does not generate codes", async ({ page }) => {
    await openPage(page);
    await expect(page.getByRole("heading", { name: es.notifications.drainOff.title })).toHaveCount(
      0,
    );
    const card = sectionOf(page);
    await expect(card.getByText(telegram.noBot.title)).toBeVisible();
    await expect(card.getByRole("button", { name: telegram.generate })).toHaveCount(0);
    await expectClean(page);
  });
});
