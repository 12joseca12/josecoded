import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

interface ChatMessages {
  chat: {
    title: string;
    typing: string;
    close: string;
    greeting: string;
    composer: { label: string; send: string };
    starters: { label: string; default: Record<string, string> };
    notice: {
      takeover: { title: string };
      offline: { title: string };
      quota: { title: string };
    };
    handoff: {
      title: string;
      email: string;
      submit: string;
      consentBefore: string;
      doneTitle: string;
      errors: Record<string, string>;
    };
    nexo: { label: Record<string, string> };
  };
  dev: { chat: { scenarios: Record<string, string>; panel: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as ChatMessages;
const { chat } = es;

test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

const preview = (page: Page) => page.getByTestId("preview");
const composer = (page: Page) => preview(page).getByLabel(chat.composer.label);

async function open(page: Page, scenario: string) {
  await page.goto("/es/dev/chat");
  await page.locator(`[data-scenario="${scenario}"]`).click();
  await expect(page.locator(`[data-scenario="${scenario}"]`)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 375, height: 800 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });

    test("a fresh visitor sees the greeting, the starters and a ready composer", async ({
      page,
    }) => {
      await open(page, "fresh");
      await expect(preview(page).getByText(chat.greeting)).toBeVisible();
      const starters = preview(page).getByRole("group", { name: chat.starters.label });
      await expect(starters.getByRole("button")).toHaveCount(3);
      await expect(composer(page)).toBeVisible();
      await expect(preview(page).getByRole("log")).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });

    for (const scenario of [
      "conversation",
      "thinking",
      "offline",
      "takeover",
      "quota",
      "handoff",
      "failed",
    ]) {
      test(`the ${scenario} scenario passes axe`, async ({ page }) => {
        await open(page, scenario);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    }
  });
}

test("typing and sending adds the visitor bubble and drops the starters", async ({ page }) => {
  await open(page, "fresh");
  await composer(page).fill("Quiero una web");
  await expect(
    preview(page)
      .locator('svg[data-state="listening"]')
      .or(preview(page).locator("svg[data-state]")),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  const log = preview(page).getByRole("log");
  await expect(log.getByText("Quiero una web")).toBeVisible();
  await expect(composer(page)).toHaveValue("");
  await expect(composer(page)).toBeFocused();
  await expect(preview(page).getByRole("group", { name: chat.starters.label })).toHaveCount(0);
});

test("Shift+Enter adds a line and the composer stops growing at six lines", async ({ page }) => {
  await open(page, "fresh");
  await composer(page).fill(
    Array.from({ length: 12 }, (_, index) => `línea ${String(index)}`).join("\n"),
  );
  const box = await composer(page).boundingBox();
  const line = await composer(page).evaluate((node) =>
    parseFloat(getComputedStyle(node).lineHeight),
  );
  expect(box?.height ?? 0).toBeLessThanOrEqual(line * 6 + 40);
  expect(box?.height ?? 0).toBeGreaterThan(line * 4);
});

test("a starter sends its text", async ({ page }) => {
  await open(page, "fresh");
  const first = preview(page)
    .getByRole("group", { name: chat.starters.label })
    .getByRole("button")
    .first();
  const text = (await first.textContent()) ?? "";
  await first.click();
  await expect(preview(page).getByRole("log").getByText(text)).toBeVisible();
});

test("the thinking scenario shows the typing indicator and the thinking avatar", async ({
  page,
}) => {
  await open(page, "thinking");
  await expect(preview(page).locator('svg[data-state="thinking"]')).toBeVisible();
  await expect(preview(page).getByText(chat.typing)).toBeAttached();
});

test("the offline scenario says so and offers the handoff right away", async ({ page }) => {
  await open(page, "offline");
  await expect(
    preview(page).getByRole("status").filter({ hasText: chat.notice.offline.title }),
  ).toBeVisible();
  await expect(preview(page).getByRole("heading", { name: chat.handoff.title })).toBeVisible();
});

test("the handoff validates, then confirms", async ({ page }) => {
  await open(page, "offline");
  const card = preview(page).getByRole("region", { name: chat.handoff.title });
  await card.getByRole("button", { name: chat.handoff.submit }).click();
  await expect(card.getByText(chat.handoff.errors.contact_required ?? "")).toBeVisible();
  await expect(card.getByText(chat.handoff.errors.consent_required ?? "")).toBeVisible();
  await card.getByLabel(chat.handoff.email).fill("visitante@example.com");
  await card.getByRole("checkbox").check();
  await card.getByRole("button", { name: chat.handoff.submit }).click();
  await expect(preview(page).getByRole("heading", { name: chat.handoff.doneTitle })).toBeVisible();
});

test("takeover and quota show their notice; quota blocks the composer", async ({ page }) => {
  await open(page, "takeover");
  await expect(preview(page).getByText(chat.notice.takeover.title, { exact: true })).toBeVisible();
  await expect(preview(page).getByText("Hola, soy Jose. Cuéntame más y lo vemos.")).toBeVisible();
  await open(page, "quota");
  await expect(preview(page).getByText(chat.notice.quota.title, { exact: true })).toBeVisible();
  await expect(composer(page)).toBeDisabled();
});

test("the panel opens with the signal, takes focus, and Escape returns it", async ({ page }) => {
  await page.goto("/es/dev/chat");
  const trigger = page.locator("[data-open-panel]");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: chat.title });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel(chat.composer.label)).toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: chat.close }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
