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

const chat = (path: string) => msg(`admin.chat.${path}`);
const room = (path: string) => msg(`room.${path}`);

const rooms = {
  closer: "c0000000-0000-4000-8000-000000000001",
  visitor: "c0000000-0000-4000-8000-000000000002",
  client: "c0000000-0000-4000-8000-000000000003",
  archived: "c0000000-0000-4000-8000-000000000004",
};
const cleo = "00000000-0000-4000-8000-0000000000c1";
const lead = "10000000-0000-4000-8000-000000000003";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.62" } });

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

async function setMode(page: Page, mode: object) {
  await page.request.post(`${mock}/__chat/mode?tag=${tag.value}`, { data: mode });
}

async function push(page: Page, data: object) {
  await page.request.post(`${mock}/__chat/push?tag=${tag.value}`, { data });
}

async function patchRoom(page: Page, id: string, set: object) {
  await page.request.post(`${mock}/__chat/room?tag=${tag.value}`, { data: { room: id, set } });
}

async function openRoom(page: Page, id: string) {
  await page.goto(`/es/admin/chat/${id}`);
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

test("a closer cannot open the chat inbox", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/chat");
  expect(response?.status()).toBe(404);
});

test("the inbox lists visitors first, counts every tab and shows the unread badge", async ({
  page,
}) => {
  await signInAdmin(page, tag);
  await page.goto("/es/admin/chat");
  await expect(page.getByRole("heading", { level: 1, name: chat("title") })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: chat("tabs.label") });
  await expect(tabs.getByRole("link", { name: /Visitantes/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(tabs.getByRole("link", { name: /Visitantes.*1/ })).toBeVisible();
  const row = page.getByRole("link", { name: /Hola, cuanto cuesta/ });
  await expect(row).toContainText("Hola, cuanto cuesta una web?");
  await expect(row).toContainText("/es/servicios");
  await expect(row).toContainText(chat("row.nexoOn"));
  await expect(row).toContainText("1 sin leer");

  await tabs.getByRole("link", { name: /Personas/ }).click();
  await expect(page.getByRole("link", { name: /Cleo Closer/ })).toBeVisible();
  await tabs.getByRole("link", { name: /Clientes/ }).click();
  const client = page.getByRole("link", { name: /Buenos dias, ya tengo el logo/ });
  await expect(client).toContainText(msg("room.consent.pending"));
  await tabs.getByRole("link", { name: /Archivadas/ }).click();
  await expect(page.getByRole("link", { name: /Dani Closer/ })).toContainText(chat("row.archived"));
});

test("an empty inbox and a failing inbox have their own states", async ({ page }) => {
  await signInAdmin(page, tag);
  await setMode(page, { summaries: "empty" });
  await page.goto("/es/admin/chat");
  await expect(page.getByRole("heading", { name: chat("empty.visitors.title") })).toBeVisible();

  await setMode(page, { summaries: "error" });
  await page.goto("/es/admin/chat");
  await expect(page.getByRole("heading", { name: chat("error.title") })).toBeVisible();
  await setMode(page, { summaries: "data" });
  await page.getByRole("button", { name: chat("error.retry") }).click();
  await expect(page.getByRole("link", { name: /Hola, cuanto cuesta/ })).toBeVisible();
});

test("Jose reads a room, answers and receives the closer's reply by polling", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.closer);
  const log = page.getByRole("log", { name: room("threadLabel") });
  await expect(log).toContainText("Hola Jose, tengo una duda.");
  await expect(log).toContainText("Respondo yo, Nexo, porque nadie ha contestado a tiempo.");

  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Cuéntame más");
  await composer.press("Enter");
  await expect(log).toContainText("Cuéntame más");

  await push(page, { room: rooms.closer, body: "Mensaje nuevo del closer", author: cleo });
  await expect(log).toContainText("Mensaje nuevo del closer");

  const calls = (await (
    await page.request.get(`${mock}/__chat/calls?tag=${tag.value}`)
  ).json()) as {
    name: string;
    room?: string;
  }[];
  expect(calls.filter((call) => call.name === "message_sent")).toHaveLength(1);
  expect(calls.some((call) => call.name === "mark_read")).toBe(true);
});

test("a failed send keeps the text and says why", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.closer);
  await setMode(page, { send: "forbidden" });
  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("No debería salir");
  await composer.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: room("errors.forbidden") })).toBeVisible();
  await expect(composer).toHaveValue("No debería salir");
});

test("switching Nexo off leaves a system message and the switch reflects it", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.closer);
  const toggle = page.getByRole("switch", { name: room("ai.label") });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("log")).toContainText(room("system.ai_off"));
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("log")).toContainText(room("system.ai_on"));
});

test("members can be added and removed from a private room", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.closer);
  await page.getByLabel(room("members.addSelect")).selectOption({ label: "Dani Closer" });
  await page.getByRole("button", { name: room("members.addButton") }).click();
  await expect(page.getByRole("log")).toContainText("Dani Closer se ha unido a la sala.");
  await expect(page.getByRole("list").filter({ hasText: "Dani Closer" }).first()).toBeVisible();

  await page.getByRole("button", { name: /Quitar a Dani Closer/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Dani Closer ha salido de la sala.");
});

test("a visitor room has no member editor and explains why there is no lead yet", async ({
  page,
}) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.visitor);
  await expect(page.getByRole("heading", { name: chat("detail.titleVisitor") })).toBeVisible();
  await expect(page.getByText(chat("detail.lead.none"))).toBeVisible();
  await expect(page.getByLabel(room("members.addSelect"))).toHaveCount(0);
  await expect(page.getByText("/es/servicios").first()).toBeVisible();
});

test("a visitor lead becomes a contact from the room", async ({ page }) => {
  await signInAdmin(page, tag);
  await patchRoom(page, rooms.visitor, { lead_id: lead });
  await openRoom(page, rooms.visitor);
  await page.getByRole("button", { name: chat("detail.lead.button") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: chat("detail.lead.submit") }).click();
  await expect(dialog).toBeHidden();
});

test("a failing contact creation shows the typed error and keeps the dialog", async ({ page }) => {
  await signInAdmin(page, tag);
  await patchRoom(page, rooms.visitor, { lead_id: lead });
  await page.request.post(`${mock}/__auth/rpc-error?tag=${tag.value}`, {
    data: { error: { code: "P0001", message: "contact_conflict" } },
  });
  await openRoom(page, rooms.visitor);
  await page.getByRole("button", { name: chat("detail.lead.button") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: chat("detail.lead.submit") }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    chat("detail.lead.errors.contact_conflict"),
  );
});

test("archiving a room turns it read-only", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.closer);
  await page.getByRole("button", { name: chat("detail.archive.trigger") }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: chat("detail.archive.submit") })
    .click();
  await expect(page.getByText(chat("detail.archivedNote"))).toBeVisible();
  await expect(page.getByText(room("composer.archived"))).toBeVisible();
  await expect(page.getByLabel(room("composer.label"))).toHaveCount(0);
});

test("an archived room opens in read-only mode", async ({ page }) => {
  await signInAdmin(page, tag);
  await openRoom(page, rooms.archived);
  await expect(page.getByText(room("composer.archived"))).toBeVisible();
  await expect(page.getByRole("switch", { name: room("ai.label") })).toBeDisabled();
});

test("an unknown room is a 404", async ({ page }) => {
  await signInAdmin(page, tag);
  await page.goto("/es/admin/chat/c0000000-0000-4000-8000-0000000000ff");
  await expect(page.getByRole("heading", { name: msg("errors.notFound.title") })).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 800 },
]) {
  test(`the inbox and a room pass axe at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signInAdmin(page, tag);
    await page.goto("/es/admin/chat");
    await expect(page.getByRole("link", { name: /Hola, cuanto cuesta/ }).first()).toBeVisible();
    await expectClean(page);
    await openRoom(page, rooms.client);
    await expectClean(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}
