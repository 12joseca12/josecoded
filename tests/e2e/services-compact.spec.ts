import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

interface Messages {
  services: { faq: { hub: Record<string, string>; freelance: Record<string, string> } };
  nexoChat: Record<string, string>;
  chat: { nexo: { label: Record<string, string> } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const shots = "/tmp/claude-0/-home-user/d354c808-0499-5ef6-99b4-dc711550feda/scratchpad";

const sizes = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
] as const;

for (const size of sizes) {
  test(`hub bento fits one screen at ${size.width}x${size.height} with no tile overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/es/servicios");
    const section = page.locator("#vias");
    await section.scrollIntoViewIfNeeded();
    const section_ = await section.boundingBox();
    expect(section_?.height ?? 0).toBeLessThanOrEqual(size.height);
    const tiles = await page.locator("#vias article").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return {
          bottom: box.bottom,
          overflowY: node.scrollHeight - node.clientHeight,
          overflowX: node.scrollWidth - node.clientWidth,
        };
      }),
    );
    expect(tiles).toHaveLength(4);
    const sectionBottom = (section_?.y ?? 0) + (section_?.height ?? 0);
    for (const tile of tiles) {
      expect(tile.overflowY).toBeLessThanOrEqual(1);
      expect(tile.overflowX).toBeLessThanOrEqual(1);
      expect(tile.bottom).toBeLessThanOrEqual(sectionBottom);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
  });
}

test("hub need tiles are short questions with one line of support and one icon", async ({
  page,
}) => {
  await page.goto("/es/servicios");
  for (const id of ["contratacion", "project", "freelance"]) {
    const tile = page.locator(`#${id}`);
    const title = (await tile.locator("h3").textContent()) ?? "";
    expect(title.trim().split(/\s+/).length).toBeLessThanOrEqual(7);
    expect(title).toMatch(/^¿.*\?$/);
    await expect(tile.locator("p")).toHaveCount(1);
    await expect(tile.locator("svg")).toHaveCount(2);
    await expect(tile.locator("ul, ol, dl")).toHaveCount(0);
  }
});

test("hub bento stays short at 375", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/es/servicios");
  const box = await page.locator("#vias").boundingBox();
  expect(box?.height ?? 0).toBeLessThan(812 * 2);
});

const chatPages = [
  { name: "hub", path: "/es/servicios", faq: es.services.faq.hub },
  { name: "freelance", path: "/es/servicios/freelance", faq: es.services.faq.freelance },
] as const;

const chat = (page: Page) => page.getByTestId("nexo-chat");
const log = (page: Page) => chat(page).getByRole("log");
const ask = async (page: Page, text: string) => {
  await chat(page)
    .getByLabel(es.nexoChat.inputLabel ?? "")
    .fill(text);
  await chat(page)
    .getByRole("button", { name: es.nexoChat.send ?? "" })
    .click();
};

for (const entry of chatPages) {
  test.describe(`${entry.name} FAQ chat`, () => {
    test("greets, suggests the page questions and answers a tapped chip", async ({ page }) => {
      await page.goto(entry.path);
      await expect(chat(page).getByRole("heading", { level: 3 })).toHaveText(
        es.nexoChat.title ?? "",
      );
      await expect(log(page)).toContainText(es.nexoChat.greeting ?? "");
      const chips = chat(page).getByRole("group", { name: es.nexoChat.suggestionsLabel });
      const buttons = chips.getByRole("button");
      await expect(buttons).toHaveCount(4);
      await expect(buttons.first()).toHaveText(entry.faq.q1 ?? "");
      await buttons.first().click();
      await expect(log(page).locator("[data-typing]")).toBeVisible();
      await expect(log(page)).toContainText(entry.faq.a1 ?? "");
      await expect(log(page).locator("[data-typing]")).toHaveCount(0);
      await expect(log(page).locator('li[data-from="user"]')).toHaveText(
        `${es.nexoChat.you}${entry.faq.q1}`,
      );
    });

    test("answers a typed question with the matching entry", async ({ page }) => {
      await page.goto(entry.path);
      const probe =
        entry.name === "hub" ? "¿Puedes facturar con IVA?" : "¿Y si crece el alcance de la tarea?";
      await ask(page, probe);
      await expect(log(page)).toContainText(
        (entry.name === "hub" ? entry.faq.a2 : entry.faq.a4) ?? "",
      );
      await expect(chat(page).getByLabel(es.nexoChat.inputLabel ?? "")).toHaveValue("");
    });

    test("answers an objection added to the FAQ", async ({ page }) => {
      await page.goto(entry.path);
      await ask(page, "¿Necesitas que firme un NDA?");
      await expect(log(page)).toContainText(
        (entry.name === "hub" ? es.services.faq.hub.a5 : es.services.faq.freelance.a5) ?? "",
      );
    });

    test("hands off with the form when nothing matches", async ({ page }) => {
      await page.goto(entry.path);
      await ask(page, "kubernetes");
      await expect(log(page)).toContainText(es.nexoChat.fallback ?? "");
      await expect(log(page).getByRole("link", { name: es.nexoChat.form })).toHaveAttribute(
        "href",
        "/es/contacto#formulario",
      );
      await expect(log(page).getByRole("button")).toHaveCount(0);
    });

    test("the log is a polite live region and the input is labelled", async ({ page }) => {
      await page.goto(entry.path);
      const region = log(page);
      await expect(region).toHaveAttribute("aria-live", "polite");
      await expect(region).toHaveAttribute("aria-label", es.nexoChat.logLabel ?? "");
      await expect(chat(page).getByLabel(es.nexoChat.inputLabel ?? "")).toBeVisible();
    });

    test("works with the keyboard", async ({ page }) => {
      await page.goto(entry.path);
      const input = chat(page).getByLabel(es.nexoChat.inputLabel ?? "");
      await input.focus();
      await page.keyboard.type("remoto madrid horas");
      await page.keyboard.press("Enter");
      await expect(log(page).locator('li[data-from="user"]')).toHaveCount(1);
      await expect(log(page).locator('li[data-from="nexo"]')).toHaveCount(2);
      await expect(input).toBeFocused();
    });

    test("stays on the right of the FAQ on desktop and under it on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(entry.path);
      const faq = await page.locator("#preguntas details").first().boundingBox();
      const card = await chat(page).boundingBox();
      expect(card?.x ?? 0).toBeGreaterThan((faq?.x ?? 0) + (faq?.width ?? 0));
      await page.setViewportSize({ width: 375, height: 812 });
      const lastFaq = await page.locator("#preguntas details").last().boundingBox();
      const below = await chat(page).boundingBox();
      expect(below?.y ?? 0).toBeGreaterThan((lastFaq?.y ?? 0) + (lastFaq?.height ?? 0) - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        375,
      );
    });

    for (const width of [1440, 375]) {
      test(`passes axe at ${width} mid-conversation`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(entry.path);
        await chat(page).getByRole("group").getByRole("button").first().click();
        await expect(log(page)).toContainText(entry.faq.a1 ?? "");
        await ask(page, "kubernetes");
        await expect(log(page)).toContainText(es.nexoChat.fallback ?? "");
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    }
  });
}

test("Nexo loads only when the chat reaches the screen and pauses when it leaves", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es/servicios");
  await page.waitForLoadState("networkidle");
  await expect(chat(page).locator("svg[data-state]")).toHaveCount(0);
  await chat(page).scrollIntoViewIfNeeded();
  const nexo = chat(page).locator("svg[data-state]");
  await expect(nexo).toHaveCount(1);
  await expect(nexo).not.toHaveAttribute("data-paused", "true");
  const name = (await nexo.getAttribute("aria-label")) ?? "";
  expect([es.chat.nexo.label.greeting, es.chat.nexo.label.idle]).toContain(name);
  await page.evaluate(() => {
    window.scrollTo({ top: 0 });
  });
  await expect(nexo).toHaveAttribute("data-paused", "true");
});

test("Nexo shows thinking while it prepares the answer", async ({ page }) => {
  await page.goto("/es/servicios");
  await chat(page).scrollIntoViewIfNeeded();
  await expect(chat(page).locator("svg[data-state]")).toHaveCount(1);
  await ask(page, "kubernetes");
  await expect(chat(page).locator("svg[data-state]")).toHaveAttribute("data-state", "thinking");
  await expect(chat(page).locator("svg[data-state]")).toHaveAttribute("data-state", "talking");
});

test("reduced motion removes the bubble and typing animations", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/es/servicios");
  await ask(page, "kubernetes");
  await expect(log(page)).toContainText(es.nexoChat.fallback ?? "");
  const names = await log(page)
    .locator("li")
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
  expect(new Set(names)).toEqual(new Set(["none"]));
  await context.close();
});

test("the chat card is coral with charcoal and steel-light bubbles at AA contrast", async ({
  page,
}) => {
  await page.goto("/es/servicios");
  await ask(page, "kubernetes");
  await expect(log(page)).toContainText(es.nexoChat.fallback ?? "");
  const colours = await chat(page).evaluate((card) => {
    const style = (node: Element | null) => (node ? getComputedStyle(node) : null);
    const user = card.querySelector('li[data-from="user"] p');
    const nexo = card.querySelector('li[data-from="nexo"] p');
    return {
      card: style(card)?.backgroundColor,
      cardInk: style(card)?.color,
      userBg: style(user)?.backgroundColor,
      userInk: style(user)?.color,
      nexoBg: style(nexo)?.backgroundColor,
      nexoInk: style(nexo)?.color,
    };
  });
  expect(colours.card).toBe("rgb(255, 75, 50)");
  expect(colours.cardInk).toBe("rgb(23, 25, 28)");
  expect(colours.userBg).toBe("rgb(23, 25, 28)");
  expect(colours.nexoInk).toBe("rgb(23, 25, 28)");
  expect(colours.nexoBg).not.toBe(colours.userBg);
});

test("capture the compact hub and the FAQ chat", async ({ page }) => {
  test.skip(process.env.CAPTURE !== "true", "screenshots are captured on demand");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es/servicios");
  await page.locator("#preguntas").scrollIntoViewIfNeeded();
  await page.locator("#preguntas details").first().locator("summary").click();
  await chat(page).getByRole("group").getByRole("button").nth(1).click();
  await expect(log(page)).toContainText(es.services.faq.hub.a2 ?? "");
  await ask(page, "kubernetes");
  await expect(log(page)).toContainText(es.nexoChat.fallback ?? "");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/compact-faq-chat-1440.png` });
  await page.setViewportSize({ width: 375, height: 812 });
  await chat(page).scrollIntoViewIfNeeded();
  await chat(page).screenshot({ path: `${shots}/compact-faq-chat-375.png` });
});
