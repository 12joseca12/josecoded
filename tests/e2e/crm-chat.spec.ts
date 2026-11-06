import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

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

const chat = (path: string) => msg(`crm.chat.${path}`);
const room = (path: string) => msg(`room.${path}`);

const ownRoom = "c0000000-0000-4000-8000-000000000001";
const clientRoom = "c0000000-0000-4000-8000-000000000003";
const joseId = "00000000-0000-4000-8000-0000000000a2";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.63" } });

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

async function calls(page: Page) {
  const response = await page.request.get(`${mock}/__chat/calls?tag=${tag.value}`);
  return (await response.json()) as { name: string; room?: string }[];
}

test("a closer lands in their room with Jose, writes and receives by polling", async ({ page }) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm/chat");
  await expect(page.getByRole("heading", { level: 1, name: chat("title") })).toBeVisible();
  const log = page.getByRole("log", { name: room("threadLabel") });
  await expect(log).toContainText("Hola Jose, tengo una duda.");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(chat("room.jose")) })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Gracias por la ayuda");
  await composer.press("Enter");
  await expect(log).toContainText("Gracias por la ayuda");

  await page.request.post(`${mock}/__chat/push?tag=${tag.value}`, {
    data: { room: ownRoom, body: "Respuesta de Jose", author: joseId },
  });
  await expect(log).toContainText("Respuesta de Jose");

  const made = await calls(page);
  expect(made.some((call) => call.name === "ensure_my_conversation")).toBe(true);
  expect(made.filter((call) => call.name === "message_sent")).toHaveLength(1);
});

test("a closer cannot switch Nexo or edit members", async ({ page }) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm/chat");
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Quitar/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: room("members.title") })).toBeVisible();
  const members = page.getByRole("region", { name: room("members.title") });
  await expect(members.getByText("Cleo Closer")).toBeVisible();
  await expect(members.getByText("Jose Enrolled")).toBeVisible();
});

test("the client rooms are listed with their unread count and open from the URL", async ({
  page,
}) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm/chat");
  const link = page.getByRole("link", { name: /Buenos dias, ya tengo el logo/ });
  await expect(link).toContainText("1 sin leer");
  await link.click();
  await expect(page).toHaveURL(new RegExp(`sala=${clientRoom}`));
  await expect(page.getByRole("log", { name: room("threadLabel") })).toContainText(
    "Buenos dias, ya tengo el logo.",
  );
  await expect(page.getByText(room("consent.pending"))).toBeVisible();
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("an unknown room falls back to the own room", async ({ page }) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm/chat?sala=c0000000-0000-4000-8000-0000000000ff");
  await expect(page.getByRole("log", { name: room("threadLabel") })).toContainText(
    "Hola Jose, tengo una duda.",
  );
});

test("a failing chat has its own state and recovers", async ({ page }) => {
  await signInCloser(page, tag);
  await page.request.post(`${mock}/__chat/mode?tag=${tag.value}`, { data: { summaries: "error" } });
  await page.goto("/es/crm/chat");
  await expect(page.getByRole("heading", { name: chat("error.title") })).toBeVisible();
  await page.request.post(`${mock}/__chat/mode?tag=${tag.value}`, { data: { summaries: "data" } });
  await page.getByRole("button", { name: chat("error.retry") }).click();
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
});

test("the navigation links to the chat and the admin is sent to the inbox", async ({
  page,
  browser,
}) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm");
  await expect(page.getByRole("link", { name: msg("crm.nav.chat") }).first()).toHaveAttribute(
    "href",
    "/es/crm/chat",
  );

  const adminTag = withTag();
  const context = await browser.newContext({
    extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.64" },
  });
  const adminPage = await context.newPage();
  await signInAdmin(adminPage, adminTag);
  await adminPage.goto("/es/crm/chat");
  await expect(adminPage).toHaveURL(/\/es\/admin\/chat$/);
  await context.close();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 800 },
]) {
  test(`the chat passes axe at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signInCloser(page, tag);
    await page.goto("/es/crm/chat");
    await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
    await expectClean(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}
