import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { omen, uniqueText, visitorTokenHash } from "./support/chat";
import { mockOrigin } from "./support/staff";

interface LiveMessages {
  chatButton: { label: string };
  contactChooser: { title: string; chat: string };
  nav: { cta: string };
  chat: {
    title: string;
    close: string;
    greeting: string;
    typing: string;
    openChat: string;
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
  };
  home: { chatInvite: { label: string } };
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

async function say(page: Page, text: string) {
  await composer(page).fill(text);
  await composer(page).press("Enter");
  await expect(log(page).getByText(text)).toBeVisible();
}

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
  await composer(page).fill("[quota] muchos mensajes");
  await composer(page).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: chat.notice.quota.title })).toBeVisible();
  await expect(composer(page)).toBeDisabled();
  await expect(panel(page).locator("svg[data-state]")).toHaveAttribute("data-state", "sad");
});

test("a burst keeps the text so it can be sent again", async ({ page }) => {
  await openPanel(page);
  await composer(page).fill("[burst] rápido");
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
  await composer(page).fill("hola");
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

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 800 } });

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
