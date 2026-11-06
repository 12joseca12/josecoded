import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface Messages {
  room: {
    threadLabel: string;
    empty: string;
    composer: { label: string; send: string };
    errors: { forbidden: string; error: string };
    members: { remove: string; add: string; addSelect: string; addButton: string; removed: string };
    ai: { on: string; off: string; offTakeover: string; label: string };
  };
  dev: { room: { incoming: string; incomingBody: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.room;

const closerRoom = "c0000000-0000-4000-8000-000000000001";
const clientRoom = "c0000000-0000-4000-8000-000000000003";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.61" } });

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

test.describe("room kit on the dev page", () => {
  test("renders the thread, sends, reports failures and receives by polling", async ({ page }) => {
    await page.goto("/es/dev/ui/room");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    const log = page.getByRole("log", { name: text.threadLabel });
    await expect(log).toContainText("Hola, ¿puedes mirar el presupuesto?");
    await expect(log).toContainText("Respondo yo, Nexo");
    await expect(log).toContainText("Cleo (prueba) se ha unido a la sala.");

    const composer = page.getByLabel(text.composer.label);
    await composer.fill("Mensaje de prueba");
    await composer.press("Enter");
    await expect(log).toContainText("Mensaje de prueba");
    await expect(composer).toHaveValue("");

    await composer.fill("Esto falla [fail]");
    await composer.press("Enter");
    await expect(page.getByRole("alert").filter({ hasText: text.errors.error })).toBeVisible();
    await expect(composer).toHaveValue("Esto falla [fail]");

    await expect(page.getByRole("button", { name: text.composer.send })).toBeEnabled();
    await composer.fill("Sin permiso [forbidden]");
    await composer.press("Enter");
    await expect(page.getByRole("alert").filter({ hasText: text.errors.forbidden })).toBeVisible();

    await page.getByRole("button", { name: es.dev.room.incoming }).click();
    await expect(log).toContainText(es.dev.room.incomingBody.replace("{n}", "1"));
  });

  test("keeps Shift+Enter as a line break and disables an empty send", async ({ page }) => {
    await page.goto("/es/dev/ui/room");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    const composer = page.getByLabel(text.composer.label);
    const send = page.getByRole("button", { name: text.composer.send });
    await expect(send).toBeDisabled();
    await composer.fill("Linea uno");
    await composer.press("Shift+Enter");
    await composer.pressSequentially("Linea dos");
    await expect(composer).toHaveValue("Linea uno\nLinea dos");
    await expect(send).toBeEnabled();
  });

  test("switch, consent badges and member list work from the keyboard", async ({ page }) => {
    await page.goto("/es/dev/ui/room");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    const first = page.getByRole("switch", { name: text.ai.label }).first();
    await expect(first).toHaveAttribute("aria-checked", "true");
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText(text.ai.off, { exact: true }).first()).toBeVisible();

    const second = page.getByRole("switch", { name: text.ai.label }).nth(1);
    await expect(page.getByText(text.ai.offTakeover)).toBeVisible();
    await second.click();
    await expect(second).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("alert").filter({ hasText: /Solo Jose/ })).toBeVisible();

    await page.getByLabel(text.members.addSelect).selectOption({ label: "Dani (prueba)" });
    await page.getByRole("button", { name: text.members.addButton }).click();

    await page.getByRole("button", { name: /Quitar a Cleo/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 800 },
  ]) {
    test(`has no accessibility violations at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/es/dev/ui/room");
      await expect(page.getByRole("log", { name: text.threadLabel })).toBeVisible();
      await expectClean(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  }
});

test.describe("room messages endpoint", () => {
  test("serves the thread to a member and only newer messages with a cursor", async ({ page }) => {
    await signInAdmin(page, tag);
    const all = await page.request.get(`/api/rooms/${closerRoom}/messages`);
    expect(all.status()).toBe(200);
    const body = (await all.json()) as {
      status: string;
      messages: { body: string; created_at: string }[];
    };
    expect(body.status).toBe("done");
    expect(body.messages.map((entry) => entry.body)).toEqual([
      "Hola Jose, tengo una duda.",
      "Dime.",
      "Respondo yo, Nexo.",
    ]);

    await page.request.post(`${mock}/__chat/push?tag=${tag.value}`, {
      data: {
        room: closerRoom,
        body: "Nuevo desde el closer",
        author: "00000000-0000-4000-8000-0000000000c1",
      },
    });
    const last = body.messages.at(-1)?.created_at ?? "";
    const newer = await page.request.get(
      `/api/rooms/${closerRoom}/messages?since=${encodeURIComponent(last)}`,
    );
    const fresh = (await newer.json()) as { messages: { body: string }[] };
    expect(fresh.messages.map((entry) => entry.body)).toEqual(["Nuevo desde el closer"]);
  });

  test("hides rooms from non-members, rejects bad input and anonymous callers", async ({
    page,
    browser,
  }) => {
    await signInCloser(page, tag);
    const mine = await page.request.get(`/api/rooms/${clientRoom}/messages`);
    expect(((await mine.json()) as { messages: unknown[] }).messages.length).toBeGreaterThan(0);
    const foreign = await page.request.get(
      "/api/rooms/c0000000-0000-4000-8000-000000000002/messages",
    );
    expect(((await foreign.json()) as { messages: unknown[] }).messages).toEqual([]);
    expect((await page.request.get("/api/rooms/not-a-uuid/messages")).status()).toBe(400);
    expect((await page.request.get(`/api/rooms/${closerRoom}/messages?since=ayer`)).status()).toBe(
      400,
    );

    const anonymous = await browser.newContext();
    const denied = await anonymous.request.get(`/api/rooms/${closerRoom}/messages`);
    expect(denied.status()).toBe(401);
    await anonymous.close();
  });

  test("reports an upstream failure as a bad gateway", async ({ page }) => {
    await signInAdmin(page, tag);
    await page.request.post(`${mock}/__chat/mode?tag=${tag.value}`, {
      data: { messages: "error" },
    });
    const response = await page.request.get(`/api/rooms/${closerRoom}/messages`);
    expect(response.status()).toBe(502);
  });
});
