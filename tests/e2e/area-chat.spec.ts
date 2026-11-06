import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInClient, type Tag, withTag } from "./support/staff";

interface Tree {
  [key: string]: string | Tree;
}

const messages = JSON.parse(readFileSync("messages/es.json", "utf8")) as Tree;

function msg(path: string): string {
  let node: string | Tree | undefined = messages;
  for (const part of path.split(".")) node = typeof node === "object" ? node[part] : undefined;
  if (typeof node !== "string") throw new Error(`Missing message ${path}`);
  return node;
}

const chat = (name: string) => msg(`area.chat.${name}`);
const clientRoom = "c0000000-0000-4000-8000-000000000003";
const joseId = "00000000-0000-4000-8000-0000000000a1";
const secondId = "10000000-0000-4000-8000-000000000002";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.45" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function post(page: Page, path: string, data: Record<string, unknown>) {
  await page.request.post(`${mock}${path}?tag=${tag.value}`, { data });
}

async function calls(page: Page) {
  const response = await page.request.get(`${mock}/__chat/calls?tag=${tag.value}`);
  return (await response.json()) as { name: string; room?: string; body?: string }[];
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }) {
  await post(page, "/__area/mode", mode);
  await signInClient(page, tag);
  await page.goto("/es/area/chat");
  await expect(page.getByRole("heading", { level: 1, name: chat("title") })).toBeVisible();
}

function log(page: Page) {
  return page.getByRole("log", { name: msg("room.threadLabel") });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("the client sees the project room with the members and a pending consent", async ({
  page,
}) => {
  await open(page);
  await expect(log(page)).toContainText("Buenos dias, ya tengo el logo.");
  const members = page.getByRole("region", { name: msg("room.members.title") });
  await expect(members.getByText("Jose Admin")).toBeVisible();
  await expect(members.getByText("Cleo Closer")).toBeVisible();
  const consent = page.getByRole("region", { name: chat("consent.title") });
  await expect(consent.getByText(chat("consent.state.pending"))).toBeVisible();
  await expect(consent.getByRole("button", { name: chat("consent.grant") })).toBeVisible();
  await expectClean(page);
});

test("the client writes and receives Jose's answer", async ({ page }) => {
  await open(page);
  const composer = page.getByLabel(msg("room.composer.label"));
  await composer.fill("¿Cómo va la portada?");
  await page.getByRole("button", { name: msg("room.composer.send") }).click();
  await expect(log(page)).toContainText("¿Cómo va la portada?");
  await expect(composer).toHaveValue("");
  expect((await calls(page)).find((call) => call.name === "message_sent")).toMatchObject({
    room: clientRoom,
    body: "¿Cómo va la portada?",
  });

  await post(page, "/__chat/push", {
    room: clientRoom,
    author: joseId,
    body: "Te la enseño mañana.",
  });
  await expect(log(page)).toContainText("Te la enseño mañana.");
});

test("the client attaches a file and it shows as a download chip", async ({ page }) => {
  await open(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "logo.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 logo"),
  });
  const composer = page.getByLabel(msg("room.composer.label"));
  await composer.fill("Te paso el logo");
  await composer.press("Enter");
  await expect(log(page)).toContainText("Te paso el logo");
  await expect(log(page).getByRole("link", { name: /logo\.pdf/ })).toBeVisible();
});

test("granting and withdrawing the consent for Nexo leaves a system message", async ({ page }) => {
  await open(page);
  const consent = page.getByRole("region", { name: chat("consent.title") });
  await consent.getByRole("button", { name: chat("consent.grant") }).click();
  await expect(consent.getByText(chat("consent.state.granted"))).toBeVisible();
  await expect(consent.getByRole("status")).toHaveText(chat("consent.done.granted"));
  await expect(log(page)).toContainText(msg("room.system.consent_granted"));

  await consent.getByRole("button", { name: chat("consent.revoke") }).click();
  await expect(consent.getByText(chat("consent.state.revoked"))).toBeVisible();
  await expect(consent.getByRole("status")).toHaveText(chat("consent.done.revoked"));
  await expect(log(page)).toContainText(msg("room.system.consent_revoked"));
  expect((await calls(page)).filter((call) => call.name === "set_ai_consent")).toHaveLength(2);
});

test("a project whose room does not exist yet explains it", async ({ page }) => {
  await open(page, { mode: "two" });
  await page.goto(`/es/area/chat?proyecto=${secondId}`);
  await expect(page.getByRole("heading", { name: chat("empty.title") })).toBeVisible();
});

test("a failing room load shows its own error and keeps the page", async ({ page }) => {
  await post(page, "/__chat/mode", { messages: "error" });
  await open(page);
  await expect(page.getByRole("heading", { name: chat("error.title") })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: chat("title") })).toBeVisible();
});

test("the nav leads to the chat", async ({ page }) => {
  await post(page, "/__area/mode", { mode: "one" });
  await signInClient(page, tag);
  await page
    .getByRole("navigation")
    .first()
    .getByRole("link", { name: msg("area.nav.chat") })
    .click();
  await expect(page).toHaveURL(/\/es\/area\/chat/);
  await expect(log(page)).toBeVisible();
});

test("the room fits at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page);
  await expect(log(page)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
