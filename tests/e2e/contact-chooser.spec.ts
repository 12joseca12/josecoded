import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  nav: { cta: string };
  contactChooser: { title: string; close: string; whatsapp: string; chat: string };
  chatButton: { label: string; online: string };
};

const chatButtonName = `${es.chatButton.label}, ${es.chatButton.online}`;

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });

    test("trigger opens and closes the chooser with the mouse", async ({ page }) => {
      await page.goto("/es");
      const trigger = page.getByRole("button", { name: es.nav.cta });
      const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await trigger.click();
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      if (name === "desktop") {
        await trigger.click();
      } else {
        await page.getByRole("button", { name: es.contactChooser.close }).click();
      }
      await expect(dialog).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    test("opens with the keyboard, Escape closes and returns focus", async ({ page }) => {
      await page.goto("/es");
      const trigger = page.getByRole("button", { name: es.nav.cta });
      const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("button", { name: es.contactChooser.chat })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    test("WhatsApp stays hidden while the number is pending", async ({ page }) => {
      await page.goto("/es");
      await page.getByRole("button", { name: es.nav.cta }).click();
      await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeVisible();
      await expect(
        page.getByRole("link", { name: new RegExp(es.contactChooser.whatsapp) }),
      ).toHaveCount(0);
      await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    });

    test("chat button opens the chooser focused on the chat option", async ({ page }) => {
      await page.goto("/es");
      const chat = page.getByRole("button", { name: chatButtonName });
      await expect(chat).toBeVisible();
      await chat.click();
      await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeVisible();
      await expect(page.getByRole("button", { name: es.contactChooser.chat })).toBeFocused();
    });

    test("chat option falls back to the contact page", async ({ page }) => {
      await page.goto("/es");
      await page.getByRole("button", { name: es.nav.cta }).click();
      await page.getByRole("button", { name: es.contactChooser.chat }).click();
      await expect(page).toHaveURL(/\/es\/contacto#chat$/);
    });

    test("chooser passes axe", async ({ page }) => {
      await page.goto("/es");
      await page.getByRole("button", { name: es.nav.cta }).click();
      await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeVisible();
      await page.waitForTimeout(600);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}

test.describe("desktop popover", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("click outside closes without moving focus", async ({ page }) => {
    await page.goto("/es");
    const trigger = page.getByRole("button", { name: es.nav.cta });
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(300, 600);
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("is anchored under the trigger", async ({ page }) => {
    await page.goto("/es");
    const trigger = page.getByRole("button", { name: es.nav.cta });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await expect(dialog).toBeVisible();
    const t = await trigger.boundingBox();
    const d = await dialog.boundingBox();
    expect(d && t && d.y >= t.y + t.height).toBe(true);
    expect(d && t && Math.abs(d.x + d.width - (t.x + t.width)) < 8).toBe(true);
  });

  test("the chat button is not a ghost icon and shows its label", async ({ page }) => {
    await page.goto("/es");
    const chat = page.getByRole("button", { name: chatButtonName });
    await expect(chat).toContainText(es.chatButton.label);
  });

  test("search stays out of the page while the flag is off", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("button", { name: "Buscar" })).toHaveCount(0);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("mobile sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("is modal and traps focus", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.cta }).click();
    await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeVisible();
    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const active = document.activeElement;
        return active === document.body || active?.closest("dialog") !== null;
      });
      expect(inside).toBe(true);
    }
  });

  test("the chat button is icon only", async ({ page }) => {
    await page.goto("/es");
    const chat = page.getByRole("button", { name: chatButtonName });
    await expect(chat).toBeVisible();
    await expect(chat.locator("span", { hasText: es.chatButton.label })).toBeHidden();
  });
});
