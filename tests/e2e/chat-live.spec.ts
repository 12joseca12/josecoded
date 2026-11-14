import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { omen, uniqueText, visitorTokenHash } from "./support/chat";
import { hydrated } from "./support/hydrated";
import { mockOrigin } from "./support/staff";

interface LiveMessages {
  chatButton: { label: string };
  contactChooser: { title: string; chat: string };
  nav: { cta: string; contact: string; home: string };
  chat: {
    title: string;
    close: string;
    greeting: string;
    typing: string;
    openChat: string;
    fullscreen: string;
    composer: { label: string; send: string };
    notice: { offline: { title: string }; takeover: { title: string }; quota: { title: string } };
    handoff: {
      title: string;
      email: string;
      submit: string;
      doneTitle: string;
      errors: { consent_required: string };
    };
    errors: { burst: string; verification: string };
    system: { handoff_done: string; ai_off: string };
    page: { alternative: string; alternativeLink: string };
    nexoBar: { region: string; stop: string };
  };
  home: { chatInvite: { label: string }; hero: { ctaPrimary: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as LiveMessages;
const { chat } = es;

const panel = (page: Page) => page.getByRole("dialog", { name: chat.title });
const composer = (page: Page) => page.getByLabel(chat.composer.label);
const log = (page: Page) => page.getByRole("log");
const headerChat = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: es.chatButton.label, exact: true });

async function openPanel(page: Page) {
  await page.goto("/es");
  await headerChat(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(composer(page)).toBeFocused();
  await expect(panel(page).getByRole("button", { name: chat.composer.send })).toBeDisabled();
}

async function type(page: Page, text: string) {
  await expect(async () => {
    await composer(page).fill(text);
    await expect(panel(page).getByRole("button", { name: chat.composer.send })).toBeEnabled({
      timeout: 1000,
    });
  }).toPass();
}

async function say(page: Page, text: string) {
  await type(page, text);
  await composer(page).press("Enter");
  await expect(log(page).getByText(text)).toBeVisible();
}

async function runningHeroAnimations(page: Page) {
  return page.evaluate(
    () =>
      document
        .getElementById("hero")
        ?.getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length ?? -1,
  );
}

const chatOpenMark = (page: Page) =>
  page.evaluate(() => document.documentElement.hasAttribute("data-chat-open"));

async function hashOf(page: Page): Promise<string> {
  await expect.poll(() => visitorTokenHash(page.context())).not.toBeNull();
  const hash = await visitorTokenHash(page.context());
  if (!hash) throw new Error("no visitor cookie");
  return hash;
}

test("the header button opens the real panel and Escape returns the focus", async ({ page }) => {
  await page.goto("/es");
  const trigger = headerChat(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByText(chat.greeting)).toBeVisible();
  await expect(composer(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the contact chooser, the home and the 404 all open the same panel", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: es.nav.cta }).click();
  await page.getByRole("button", { name: es.contactChooser.chat }).click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();

  await page.getByRole("button", { name: es.home.chatInvite.label }).click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/es/esta-pagina-no-existe");
  await page.getByRole("button", { name: chat.openChat }).click();
  await expect(panel(page)).toBeVisible();
});

test("the Nexo section of the home is visible and its button opens the panel", async ({ page }) => {
  await page.goto("/es");
  const nexo = page.locator("#nexo");
  await expect(nexo).toBeVisible();
  await nexo.getByRole("button", { name: es.home.chatInvite.label }).click();
  await expect(panel(page)).toBeVisible();
});

test("the hero call to action opens the contact chooser, not the chat", async ({ page }) => {
  await page.goto("/es");
  const cta = page.locator("#hero").getByRole("link", { name: es.home.hero.ctaPrimary });
  await hydrated(cta);
  await cta.click();
  await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(cta).toBeFocused();
});

test("a first message passes the invisible check, shows offline and offers the handoff", async ({
  page,
}) => {
  await openPanel(page);
  const text = uniqueText("hola");
  await say(page, text);
  await expect(composer(page)).toHaveValue("");
  await expect(
    page.getByRole("status").filter({ hasText: chat.notice.offline.title }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: chat.handoff.title })).toBeVisible();
  const cookie = (await page.context().cookies()).find((entry) => entry.name === "jc_visitor");
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  await expect(page.locator("[data-fake-turnstile]")).toBeAttached();
});

test("Nexo answers: the avatar goes thinking, talking and back to rest", async ({
  page,
  request,
}) => {
  await openPanel(page);
  await say(page, uniqueText("pregunta"));
  const hash = await hashOf(page);
  await omen(request, hash, "online");
  await expect(
    page.getByRole("status").filter({ hasText: chat.notice.offline.title }),
  ).toBeHidden();
  const avatar = panel(page).locator("svg[data-state]");
  await expect(avatar).toHaveAttribute("data-state", "thinking");
  await expect(panel(page).getByText(chat.typing)).toBeAttached();
  await omen(request, hash, "reply", {
    body: "Te cuento cómo trabajamos.",
    sources: ["Cómo trabajo"],
  });
  await expect(log(page).getByText("Te cuento cómo trabajamos.")).toBeVisible();
  await expect(log(page).getByText("Cómo trabajo", { exact: true })).toBeVisible();
  await expect(avatar).toHaveAttribute("data-state", "talking");
  await expect(avatar).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
});

test("when Jose takes over the band appears and his message is labelled", async ({
  page,
  request,
}) => {
  await openPanel(page);
  await say(page, uniqueText("quiero hablar"));
  const hash = await hashOf(page);
  await omen(request, hash, "online");
  await omen(request, hash, "takeover");
  await omen(request, hash, "staff", { body: "Hola, soy Jose." });
  await expect(
    page.getByRole("status").filter({ hasText: chat.notice.takeover.title }),
  ).toBeVisible();
  await expect(log(page).getByText(chat.system.ai_off)).toBeVisible();
  await expect(log(page).getByText("Hola, soy Jose.")).toBeVisible();
  await expect(log(page).getByText("Jose", { exact: true })).toBeVisible();
});

test("the daily quota shows its notice and locks the composer", async ({ page }) => {
  await openPanel(page);
  await type(page, "[quota] muchos mensajes");
  await composer(page).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: chat.notice.quota.title })).toBeVisible();
  await expect(composer(page)).toBeDisabled();
  await expect(panel(page).locator("svg[data-state]")).toHaveAttribute("data-state", "sad");
});

test("a burst keeps the text so it can be sent again", async ({ page }) => {
  await openPanel(page);
  await type(page, "[burst] rápido");
  await composer(page).press("Enter");
  await expect(panel(page).getByRole("alert")).toHaveText(chat.errors.burst);
  await expect(composer(page)).toHaveValue("[burst] rápido");
  await expect(composer(page)).toBeEnabled();
});

test("a rejected check explains itself and keeps the text", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("fakeTurnstileToken", "bad-token");
  });
  await openPanel(page);
  await type(page, "hola");
  await composer(page).press("Enter");
  await expect(panel(page).getByRole("alert")).toHaveText(chat.errors.verification);
  await expect(composer(page)).toHaveValue("hola");
});

test("the handoff validates, saves the lead and the thread confirms it", async ({ page }) => {
  await openPanel(page);
  await say(page, uniqueText("dejo mi contacto"));
  const card = panel(page).getByRole("region", { name: chat.handoff.title });
  await card.getByRole("button", { name: chat.handoff.submit }).click();
  await expect(card.getByText(chat.handoff.errors.consent_required)).toBeVisible();
  const email = `visita+${uniqueText("e").replace(" ", "")}@example.com`;
  await card.getByLabel(chat.handoff.email).fill(email);
  await card.getByRole("checkbox").check();
  await card.getByRole("button", { name: chat.handoff.submit }).click();
  await expect(panel(page).getByRole("heading", { name: chat.handoff.doneTitle })).toBeVisible();
  await expect(log(page).getByText(chat.system.handoff_done)).toBeVisible();
  await expect
    .poll(async () => {
      const leads = (await (await page.request.get(`${mockOrigin}/__chat/leads`)).json()) as {
        email: string;
        source: string;
      }[];
      return leads.find((lead) => lead.email === email)?.source;
    })
    .toBe("nexo");
});

test("the conversation survives a reload and a new tab of the panel", async ({ page }) => {
  await openPanel(page);
  const text = uniqueText("persistente");
  await say(page, text);
  await hashOf(page);
  await page.reload();
  await headerChat(page).click();
  await expect(log(page).getByText(text)).toBeVisible();
});

test("without the live stream the thread keeps arriving by polling", async ({ page, request }) => {
  await page.route("**/api/chat/stream", (route) => route.abort());
  await openPanel(page);
  await say(page, uniqueText("sin stream"));
  const hash = await hashOf(page);
  await omen(request, hash, "reply", { body: "Respuesta por sondeo" });
  await expect(log(page).getByText("Respuesta por sondeo")).toBeVisible();
});

test("the full page is noindex, server-renders the thread and passes axe", async ({
  page,
  request,
}) => {
  await openPanel(page);
  const text = uniqueText("en la pagina");
  await say(page, text);
  await omen(request, await hashOf(page), "reply", { body: "Respuesta en página completa" });
  await expect(log(page).getByText("Respuesta en página completa")).toBeVisible();

  const response = await page.request.get("/es/chat");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain(text);
  expect(html).toContain("Respuesta en página completa");
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);

  await page.goto("/es/chat");
  await expect(page.getByRole("heading", { level: 1, name: chat.title })).toBeVisible();
  await expect(log(page).getByText(text)).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("the open panel pauses the hero and closing it resumes the hero", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es");
  await hydrated(headerChat(page));
  await expect.poll(() => runningHeroAnimations(page)).toBeGreaterThan(0);
  await headerChat(page).click();
  await expect(panel(page)).toBeVisible();
  expect(await chatOpenMark(page)).toBe(true);
  await expect.poll(() => runningHeroAnimations(page)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  expect(await chatOpenMark(page)).toBe(false);
  await expect.poll(() => runningHeroAnimations(page)).toBeGreaterThan(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the panel appears and leaves without a transition or a stagger", async ({ page }) => {
    await openPanel(page);
    const motion = await panel(page).evaluate((node) => ({
      property: getComputedStyle(node).transitionProperty,
      durations: getComputedStyle(node)
        .transitionDuration.split(", ")
        .map((value) => Number.parseFloat(value)),
      animations: node.getAnimations({ subtree: true }).length,
    }));
    expect(motion.property).toBe("none");
    expect(motion.durations.every((value) => value <= 0.00001)).toBe(true);
    expect(motion.animations).toBe(0);
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("the panel is a sheet with a top margin and rounded top corners", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.chatButton.label }).first().click();
    await expect(panel(page)).toBeVisible();
    await expect.poll(async () => Math.round((await panel(page).boundingBox())?.y ?? -1)).toBe(52);
    const shape = await panel(page).evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        top: style.borderTopLeftRadius,
        bottom: style.borderBottomLeftRadius,
        height: node.getBoundingClientRect().bottom,
      };
    });
    expect(shape.top).toBe("24px");
    expect(shape.bottom).toBe("0px");
    expect(Math.round(shape.height)).toBeGreaterThanOrEqual(800);
  });

  test("the panel and the full page pass axe on a phone", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: es.chatButton.label }).first().click();
    await expect(panel(page)).toBeVisible();
    await expect(composer(page)).toBeVisible();
    let result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
    await page.goto("/es/chat");
    await expect(composer(page)).toBeVisible();
    result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
  });
});

async function openSheet(page: Page) {
  await page.goto("/es");
  const opener = page.getByRole("button", { name: es.chatButton.label }).first();
  await hydrated(opener);
  await opener.click();
  await expect(panel(page)).toBeVisible();
  await expect(composer(page)).toBeFocused();
  await expect.poll(() => sheetTop(page)).toBe(52);
  return opener;
}

const sheetTop = async (page: Page) => Math.round((await panel(page).boundingBox())?.y ?? -1);

const focusInsidePanel = (page: Page) =>
  page.evaluate(() => {
    const dialog = document.querySelector("dialog[open]");
    return Boolean(dialog?.contains(document.activeElement));
  });

async function dragSheet(page: Page, from: { x: number; y: number }, distance: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) {
    await page.mouse.move(from.x, from.y + (distance * step) / 10);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(200);
  await page.mouse.up();
}

async function centerOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("mobile sheet", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens as a modal sheet over a scrim with a visible grabber", async ({ page }) => {
    await openSheet(page);
    expect(await panel(page).evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect
      .poll(() =>
        panel(page).evaluate((node) => {
          const scrim = getComputedStyle(node, "::backdrop");
          return `${scrim.backgroundColor} ${scrim.opacity}`;
        }),
      )
      .toBe("rgba(23, 25, 28, 0.22) 1");
    await expect(panel(page).locator("[data-sheet-handle]")).toBeVisible();
    const covered = await page.evaluate(
      () => document.elementFromPoint(40, 24)?.closest("dialog") != null,
    );
    expect(covered).toBe(true);
  });

  test("Tab and Shift+Tab never leave the sheet", async ({ page }) => {
    await openSheet(page);
    for (let press = 0; press < 14; press += 1) {
      await page.keyboard.press("Tab");
      expect(await focusInsidePanel(page)).toBe(true);
    }
    for (let press = 0; press < 14; press += 1) {
      await page.keyboard.press("Shift+Tab");
      expect(await focusInsidePanel(page)).toBe(true);
    }
  });

  test("Escape closes the sheet, lifts the scrim and returns the focus", async ({ page }) => {
    const opener = await openSheet(page);
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.querySelector("dialog:modal") === null)).toBe(true);
  });

  test("the sheet follows the finger and a long drag down closes it", async ({ page }) => {
    const opener = await openSheet(page);
    const start = await centerOf(panel(page).locator("[data-sheet-handle]"));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y + 120, { steps: 6 });
    await expect.poll(() => sheetTop(page)).toBe(172);
    for (let step = 1; step <= 6; step += 1) {
      await page.mouse.move(start.x, start.y + 120 + step * 50);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect(panel(page)).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a short slow drag from the header puts the sheet back", async ({ page }) => {
    await openSheet(page);
    const title = panel(page).getByRole("heading", { name: chat.title });
    await dragSheet(page, await centerOf(title), 80);
    await expect(panel(page)).toBeVisible();
    await expect.poll(() => sheetTop(page)).toBe(52);
  });

  test("a quick flick down closes the sheet", async ({ page }) => {
    await openSheet(page);
    const start = await centerOf(panel(page).locator("[data-sheet-handle]"));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y + 70, { steps: 4 });
    await page.mouse.up();
    await expect(panel(page)).toBeHidden();
  });

  test("a drag up that ends above the sheet keeps it open", async ({ page }) => {
    await openSheet(page);
    const start = await centerOf(panel(page).locator("[data-sheet-handle]"));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, 12, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await expect(panel(page)).toBeVisible();
    await expect.poll(() => sheetTop(page)).toBe(52);
  });

  test("pulling up stretches the sheet a little and lets it settle back", async ({ page }) => {
    await openSheet(page);
    const start = await centerOf(panel(page).locator("[data-sheet-handle]"));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y - 200, { steps: 10 });
    const lifted = await sheetTop(page);
    expect(lifted).toBeLessThan(52);
    expect(lifted).toBeGreaterThanOrEqual(52 - 14);
    const bottom = await panel(page).evaluate((node) => node.getBoundingClientRect().bottom);
    expect(bottom).toBeGreaterThanOrEqual(812);
    await page.mouse.up();
    await expect.poll(() => sheetTop(page)).toBe(52);
  });

  test("a released drag times the exit by the distance left", async ({ page }) => {
    await openSheet(page);
    const start = await centerOf(panel(page).locator("[data-sheet-handle]"));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y + 70, { steps: 4 });
    await page.mouse.up();
    await expect(panel(page)).toBeHidden();
    const exit = await page
      .locator("dialog")
      .evaluate((node) => Number.parseFloat(node.style.getPropertyValue("--sheet-exit")));
    expect(exit).toBeGreaterThanOrEqual(180);
    expect(exit).toBeLessThanOrEqual(420);
  });

  test("the thread still scrolls and the header buttons still work", async ({ page }) => {
    await openSheet(page);
    const touchAction = await log(page).evaluate((node) => getComputedStyle(node).touchAction);
    expect(touchAction).toBe("auto");
    await panel(page).getByRole("button", { name: chat.close }).click();
    await expect(panel(page)).toBeHidden();
  });
});

test.describe("mobile sheet with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 375, height: 812 } });

  test("the scrim and a released drag settle without a transition", async ({ page }) => {
    await openSheet(page);
    const scrim = await panel(page).evaluate((node) => {
      const style = getComputedStyle(node, "::backdrop");
      return { property: style.transitionProperty, opacity: style.opacity };
    });
    expect(scrim).toEqual({ property: "none", opacity: "1" });
    await dragSheet(page, await centerOf(panel(page).locator("[data-sheet-handle]")), 80);
    expect(await sheetTop(page)).toBe(52);
    expect(await panel(page).evaluate((node) => node.getAnimations().length)).toBe(0);
  });
});

test("the desktop panel stays non-modal and has no scrim", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es");
  await hydrated(headerChat(page));
  await headerChat(page).click();
  await expect(panel(page)).toBeVisible();
  expect(await panel(page).evaluate((node) => node.matches(":modal"))).toBe(false);
  await expect(panel(page).locator("[data-sheet-handle]")).toBeHidden();
  await page.getByRole("banner").getByRole("link").first().click({ trial: true });
  expect(await page.evaluate(() => document.querySelector("dialog:modal") === null)).toBe(true);
});

test.describe("desktop panel layout", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("the composer sits on the bottom edge and a long thread scrolls inside", async ({
    page,
  }) => {
    await page.goto("/es");
    await hydrated(headerChat(page));
    await headerChat(page).click();
    await expect(panel(page)).toBeVisible();
    const form = panel(page)
      .locator("form")
      .filter({ has: composer(page) });
    const edges = async () => {
      const box = await panel(page).boundingBox();
      const own = await form.boundingBox();
      if (!box || !own) throw new Error("no box");
      return { panel: box.y + box.height, composer: own.y + own.height, height: box.height };
    };
    await expect
      .poll(async () => panel(page).evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
    const before = await edges();
    expect(Math.abs(before.panel - before.composer)).toBeLessThanOrEqual(2);

    await log(page).evaluate((node) => {
      const list = node.querySelector("ul") ?? node;
      for (let index = 0; index < 40; index += 1) {
        const item = document.createElement("li");
        item.textContent = `línea ${index}`;
        item.style.blockSize = "3rem";
        list.append(item);
      }
    });
    const after = await edges();
    expect(after.height).toBe(before.height);
    expect(Math.abs(after.panel - after.composer)).toBeLessThanOrEqual(2);
    const scroll = await log(page).evaluate((node) => {
      const scroller = [node, ...node.querySelectorAll("*")].find(
        (element) =>
          element.scrollHeight > element.clientHeight + 1 &&
          ["auto", "scroll"].includes(getComputedStyle(element).overflowY),
      );
      return Boolean(scroller);
    });
    expect(scroll).toBe(true);
  });
});

test.describe("turning the device", () => {
  test("a sheet opened upright becomes the floating panel and keeps the draft", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openSheet(page);
    await composer(page).fill("borrador al girar");
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect.poll(() => panel(page).evaluate((node) => node.matches(":modal"))).toBe(false);
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).locator("[data-sheet-handle]")).toBeHidden();
    await expect(composer(page)).toHaveValue("borrador al girar");
    await expect(composer(page)).toBeFocused();
    expect(await page.evaluate(() => document.querySelector("dialog:modal") === null)).toBe(true);
    expect(await panel(page).evaluate((node) => node.getAnimations().length)).toBe(0);
  });

  test("a floating panel turned upright becomes the modal sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/es");
    await hydrated(headerChat(page));
    await headerChat(page).click();
    await expect(composer(page)).toBeFocused();
    await composer(page).fill("otro borrador");
    await page.setViewportSize({ width: 375, height: 812 });
    await expect.poll(() => panel(page).evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(panel(page).locator("[data-sheet-handle]")).toBeVisible();
    await expect(composer(page)).toHaveValue("otro borrador");
    await expect(composer(page)).toBeFocused();
    await expect.poll(() => sheetTop(page)).toBe(52);
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
  });
});

test.describe("touch phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test("opening the sheet by touch focuses the dialog, not the keyboard", async ({ page }) => {
    await page.goto("/es");
    const opener = page.getByRole("button", { name: es.chatButton.label }).first();
    await hydrated(opener);
    await opener.tap();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toBeFocused();
    await expect(composer(page)).not.toBeFocused();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a first visit still reads the page and points to the form", async ({ page }) => {
    await page.goto("/es/chat");
    await expect(page.getByRole("link", { name: chat.page.alternativeLink })).toBeVisible();
    await expect(log(page)).toBeVisible();
  });
});

test("a returning visitor can send from the plain form", async ({ browser, page }) => {
  await openPanel(page);
  await say(page, uniqueText("antes"));
  await hashOf(page);
  const state = await page.context().storageState();
  const plain = await browser.newContext({ storageState: state, javaScriptEnabled: false });
  const plainPage = await plain.newPage();
  await plainPage.goto("/es/chat");
  const text = uniqueText("sin js");
  await plainPage.getByLabel(chat.composer.label).fill(text);
  await plainPage.getByRole("button", { name: chat.composer.send }).click();
  await expect(plainPage.getByText(text)).toBeVisible();
  await plain.close();
});

test.describe("embedded on the contact page", () => {
  const embedded = (page: Page) => page.locator("#chat");
  const embeddedComposer = (page: Page) => embedded(page).getByLabel(chat.composer.label);
  const noOverflow = (page: Page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );

  test("sits to the right of the form on desktop and stays in view while scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/contacto");
    await expect(embedded(page)).toBeVisible();
    await expect(embeddedComposer(page)).toBeVisible();
    const form = await page.locator("#formulario").boundingBox();
    const box = await embedded(page).boundingBox();
    if (!form || !box) throw new Error("missing boxes");
    expect(box.x).toBeGreaterThanOrEqual(form.x + form.width - 1);
    await page.evaluate(() => {
      window.scrollTo(0, 1400);
    });
    await expect
      .poll(async () => (await embedded(page).boundingBox())?.y ?? Number.POSITIVE_INFINITY)
      .toBeLessThan(200);
    expect((await embedded(page).boundingBox())?.y).toBeGreaterThanOrEqual(0);
    expect(await noOverflow(page)).toBe(true);
  });

  test("goes below the form on a phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es/contacto");
    await expect(embedded(page)).toBeVisible();
    const form = await page.locator("#formulario").boundingBox();
    const box = await embedded(page).boundingBox();
    if (!form || !box) throw new Error("missing boxes");
    expect(box.y).toBeGreaterThanOrEqual(form.y + form.height - 1);
    expect(await noOverflow(page)).toBe(true);
  });

  test("the header button and the chooser focus the embedded chat and open no panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/contacto");
    await expect(embeddedComposer(page)).toBeVisible();
    await headerChat(page).click();
    await expect(embeddedComposer(page)).toBeFocused();
    await expect(panel(page)).toHaveCount(0);
    expect(await chatOpenMark(page)).toBe(false);

    await page.getByLabel(chat.composer.label).evaluate((node) => {
      (node as HTMLElement).blur();
    });
    await page.getByRole("button", { name: es.nav.cta }).click();
    await page.getByRole("button", { name: es.contactChooser.chat }).click();
    await expect(embeddedComposer(page)).toBeFocused();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByLabel(chat.composer.label)).toHaveCount(1);
  });

  test("on a phone the button scrolls the embedded chat into view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es/contacto");
    await expect(embeddedComposer(page)).toBeVisible();
    await headerChat(page).click();
    await expect(embeddedComposer(page)).toBeFocused();
    await expect(embeddedComposer(page)).toBeInViewport();
    await expect(panel(page)).toHaveCount(0);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("the embed offers the full page instead of a composer that cannot send", async ({
      page,
    }) => {
      await page.goto("/es/contacto");
      await expect(embedded(page).getByRole("link", { name: chat.fullscreen })).toBeVisible();
      await expect(embeddedComposer(page)).toHaveCount(0);
      await expect(page.locator("#formulario")).toBeVisible();
    });
  });

  test("an open panel closes when the visitor navigates to the contact page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPanel(page);
    expect(await chatOpenMark(page)).toBe(true);
    await page
      .getByRole("banner")
      .getByRole("link", { name: es.nav.contact, exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/es\/contacto/);
    await expect(embeddedComposer(page)).toBeVisible();
    await expect(page.getByLabel(chat.composer.label)).toHaveCount(1);
    await expect(panel(page)).toBeHidden();
    await expect.poll(() => chatOpenMark(page)).toBe(false);
  });

  test("leaving the contact page makes the header button open the panel again", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/contacto");
    await expect(embeddedComposer(page)).toBeVisible();
    await page
      .getByRole("banner")
      .getByRole("link", { name: es.nav.home, exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/es\/?$/);
    await expect(embedded(page)).toHaveCount(0);
    await headerChat(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(composer(page)).toBeFocused();
    await expect(page.getByLabel(chat.composer.label)).toHaveCount(1);
  });

  test("on a phone the sheet chooser hands the focus to the embedded composer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/es/contacto");
    await expect(embeddedComposer(page)).toBeVisible();
    await page.getByRole("button", { name: es.nav.cta }).click();
    await page.getByRole("button", { name: es.contactChooser.chat }).click();
    await expect(page.getByRole("dialog", { name: es.contactChooser.title })).toBeHidden();
    await expect(embeddedComposer(page)).toBeFocused();
    await expect(panel(page)).toHaveCount(0);
  });

  test.describe("reduced motion on a phone", () => {
    test.use({ reducedMotion: "reduce", viewport: { width: 375, height: 800 } });

    test("the button jumps to the embedded chat without smooth scrolling", async ({ page }) => {
      await page.goto("/es/contacto");
      await expect(embeddedComposer(page)).toBeVisible();
      await page.evaluate(() => {
        const recorded: unknown[] = [];
        const proto = Element.prototype;
        const scroll: unknown = Reflect.get(proto, "scrollIntoView");
        Reflect.set(proto, "scrollIntoView", function patched(this: Element, arg?: unknown) {
          recorded.push(
            typeof arg === "object" && arg !== null ? Reflect.get(arg, "behavior") : null,
          );
          Reflect.apply(scroll as () => void, this, [arg]);
        });
        Object.assign(window, { scrollBehaviors: recorded });
      });
      await headerChat(page).click();
      await expect(embeddedComposer(page)).toBeFocused();
      await expect(embeddedComposer(page)).toBeInViewport();
      const behaviors = await page.evaluate(
        () => (window as unknown as { scrollBehaviors: unknown[] }).scrollBehaviors,
      );
      expect(behaviors).toEqual(["auto"]);
    });
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 800 },
  ]) {
    test(`passes axe at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/es/contacto");
      await expect(embeddedComposer(page)).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }
});

test("the open panel on /es does not show the Nexo bar", async ({ page }) => {
  await openPanel(page);
  await expect(panel(page).getByRole("group", { name: chat.nexoBar.region })).toHaveCount(0);
  await expect(panel(page).getByRole("button", { name: chat.nexoBar.stop })).toHaveCount(0);
  await expect(page.getByRole("group", { name: chat.nexoBar.region })).toHaveCount(0);
});
