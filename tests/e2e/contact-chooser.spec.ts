import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  nav: { cta: string };
  contactChooser: { title: string; close: string; whatsapp: string; chat: string; form: string };
  chatButton: { label: string };
  contactPage: {
    head: { title: string };
    chat: { soon: string };
    ways: Record<"contratacion" | "freelance" | "project", { title: string }>;
    copy: { label: string; done: string };
    form: { title: string };
  };
};

const chatButtonName = es.chatButton.label;

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
      const chat = page.getByRole("button", { name: chatButtonName, exact: true });
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
      await expect(page.locator("#chat")).toBeVisible();
      await expect(page.locator("#chat").getByRole("status")).toHaveText(es.contactPage.chat.soon);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
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
    const chat = page.getByRole("button", { name: chatButtonName, exact: true });
    await expect(chat).toContainText(es.chatButton.label);
  });

  test("search stays out of the page while the flag is off", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("button", { name: "Buscar" })).toHaveCount(0);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("desktop popover focus and motion", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Tab out of the popover closes it", async ({ page }) => {
    await page.goto("/es");
    const trigger = page.getByRole("button", { name: es.nav.cta });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("End");
    await page.keyboard.press("Tab");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the trigger advertises a dialog popup", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("button", { name: es.nav.cta })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
  });

  test("closes when the route changes", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.cta }).click();
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await expect(dialog).toBeVisible();
    await page.evaluate(() => {
      const host = window as unknown as { next?: { router: { push: (href: string) => void } } };
      host.next?.router.push("/es/servicios");
    });
    await expect(page).toHaveURL(/\/es\/servicios$/);
    await expect(dialog).toBeHidden();
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

  test("the sheet does not translate", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.cta }).click();
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await expect(dialog).toBeVisible();
    const style = await dialog.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { transform: computed.transform, duration: computed.transitionDuration };
    });
    expect(style.transform).toBe("none");
    expect(parseFloat(style.duration)).toBeLessThan(0.001);
  });
});

test.describe("mobile sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("is modal and traps focus", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.cta }).click();
    const dialog = page.getByRole("dialog", { name: es.contactChooser.title });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
    const visited = new Set<string>();
    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press("Tab");
      const where = await page.evaluate(() => {
        const active = document.activeElement;
        if (active === null || active === document.body) return "chrome";
        return active.closest("dialog") === null ? "outside" : active.outerHTML;
      });
      expect(where).not.toBe("outside");
      visited.add(where);
    }
    expect([...visited].some((label) => label.includes(es.contactChooser.close))).toBe(true);
    expect([...visited].some((label) => label.includes(es.contactChooser.chat))).toBe(true);
  });

  test("the chat button is icon only", async ({ page }) => {
    await page.goto("/es");
    const chat = page.getByRole("button", { name: chatButtonName, exact: true });
    await expect(chat).toBeVisible();
    const box = await chat.boundingBox();
    expect(box && box.width < 56).toBe(true);
  });
});

test.describe("contact page", () => {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    test(`renders with the chat card and passes axe on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const response = await page.goto("/es/contacto");
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: new RegExp(es.contactPage.head.title) }),
      ).toBeVisible();
      await expect(page.locator("#chat")).toBeVisible();
      await expect(page.locator("#chat").getByRole("status")).toHaveText(es.contactPage.chat.soon);
      await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }

  test("is in the sitemap now that the email channels are live", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(await response.text()).toContain("/es/contacto");
  });

  for (const [way, email] of [
    ["contratacion", "hola@josecoded.com"],
    ["freelance", "freelance@josecoded.com"],
    ["project", "proyectos@josecoded.com"],
  ] as const) {
    test(`${way} card shows its email as text, a mail link and a copy button`, async ({ page }) => {
      await page.goto("/es/contacto");
      const card = page.locator(`#${way}`);
      await expect(
        card.getByRole("heading", { name: es.contactPage.ways[way].title }),
      ).toBeVisible();
      await expect(card.locator("[data-email]")).toHaveText(email);
      await expect(card.locator(`a[href="mailto:${email}"]`)).toHaveCount(1);
      await expect(
        card.getByRole("button", { name: new RegExp(es.contactPage.copy.label) }),
      ).toBeVisible();
    });
  }

  test("the copy button copies the address and confirms", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/es/contacto");
    const button = page
      .locator("#freelance")
      .getByRole("button", { name: /freelance@josecoded\.com/ });
    await button.click();
    await expect(button).toContainText(es.contactPage.copy.done);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "freelance@josecoded.com",
    );
    await expect(button).toContainText(es.contactPage.copy.label, { timeout: 5000 });
  });

  test("the formulario section holds the contact form", async ({ page }) => {
    await page.goto("/es/contacto#formulario");
    const section = page.locator("#formulario");
    await expect(section).toBeVisible();
    await expect(section.locator("form")).toHaveCount(1);
  });

  test("the chooser Formulario option lands on #formulario", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es");
    await page.getByRole("button", { name: es.nav.cta }).click();
    await page.getByRole("link", { name: new RegExp(es.contactChooser.form) }).click();
    await expect(page).toHaveURL(/\/es\/contacto#formulario$/);
    await expect(page.locator("#formulario")).toBeVisible();
  });
});
