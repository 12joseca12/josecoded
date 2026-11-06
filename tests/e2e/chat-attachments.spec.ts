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

const room = (path: string) => msg(`room.${path}`);

const closerRoom = "c0000000-0000-4000-8000-000000000001";
const visitorRoom = "c0000000-0000-4000-8000-000000000002";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.65" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
  await request.post(`${mock}/__chat/storage-reset`);
});

async function expectClean(page: Page) {
  await expect(page).toHaveTitle(/josecoded/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function open(page: Page, id = closerRoom) {
  await page.goto(`/es/admin/chat/${id}`);
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

async function storage(page: Page) {
  const response = await page.request.get(`${mock}/__chat/storage`);
  return (await response.json()) as { kind: string; path?: string; name?: string }[];
}

const pdf = {
  name: "brief.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 brief"),
};
const png = { name: "logo.png", mimeType: "image/png", buffer: Buffer.from("png-bytes") };

test("a message goes out with its files and they show as downloadable chips", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.locator('input[type="file"]').setInputFiles([pdf, png]);
  const chosen = page.getByRole("list", { name: room("attachments.selected") });
  await expect(chosen.getByRole("listitem")).toHaveCount(2);

  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Te paso el brief y el logo");
  await composer.press("Enter");

  const log = page.getByRole("log", { name: room("threadLabel") });
  await expect(log).toContainText("Te paso el brief y el logo");
  await expect(log.getByRole("link", { name: /brief\.pdf/ })).toBeVisible();
  await expect(log.getByRole("link", { name: /logo\.png/ })).toBeVisible();
  await expect(chosen).toHaveCount(0);

  const made = await storage(page);
  expect(made.filter((entry) => entry.kind === "upload")).toHaveLength(2);
  expect(made.filter((entry) => entry.kind === "register").map((entry) => entry.name)).toEqual([
    "brief.pdf",
    "logo.png",
  ]);
  expect(
    made.every(
      (entry) => entry.path === undefined || entry.path.startsWith(`conversations/${closerRoom}/`),
    ),
  ).toBe(true);
});

test("files alone are enough and the message carries their names", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.locator('input[type="file"]').setInputFiles([pdf]);
  await page.getByRole("button", { name: room("composer.send") }).click();
  const log = page.getByRole("log", { name: room("threadLabel") });
  await expect(log.getByText("brief.pdf").first()).toBeVisible();
  await expect(log.getByRole("link", { name: /brief\.pdf/ })).toBeVisible();
});

test("a chip downloads through a short signed link", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.locator('input[type="file"]').setInputFiles([pdf]);
  await page.getByLabel(room("composer.label")).fill("Adjunto");
  await page.getByLabel(room("composer.label")).press("Enter");
  const chip = page.getByRole("log").getByRole("link", { name: /brief\.pdf/ });
  const href = await chip.getAttribute("href");
  expect(href).toMatch(/^\/api\/chat\/attachments\/[0-9a-f-]{36}$/);
  const redirect = await page.request.get(href ?? "", { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toContain("/object/sign/chat-attachments/conversations/");
  expect(await redirect.text()).toBe("");
});

test("someone outside the room cannot download its files", async ({ page, browser }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.locator('input[type="file"]').setInputFiles([pdf]);
  await page.getByLabel(room("composer.label")).fill("Privado");
  await page.getByLabel(room("composer.label")).press("Enter");
  const href =
    (await page
      .getByRole("log")
      .getByRole("link", { name: /brief\.pdf/ })
      .getAttribute("href")) ?? "";

  const other = await browser.newContext({
    extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.66" },
  });
  const otherPage = await other.newPage();
  const anonymous = await otherPage.request.get(href, { maxRedirects: 0 });
  expect(anonymous.status()).toBe(404);
  await other.close();
});

test("the limits are explained before anything is uploaded", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  const input = page.locator('input[type="file"]');
  const alert = page.getByRole("alert").filter({ hasText: /./ });

  await input.setInputFiles([
    { name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("x") },
  ]);
  await expect(alert).toContainText(room("errors.type"));

  await input.setInputFiles([
    { name: "grande.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) },
  ]);
  await expect(alert).toContainText(room("errors.too_large"));

  await input.setInputFiles(
    Array.from({ length: 6 }, (_, index) => ({ ...png, name: `f${index}.png` })),
  );
  await expect(alert).toContainText(room("errors.too_many"));
  await expect(page.getByRole("list", { name: room("attachments.selected") })).toHaveCount(0);
  expect((await storage(page)).length).toBe(0);
});

test("a chosen file can be removed before sending", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.locator('input[type="file"]').setInputFiles([pdf, png]);
  await page.getByRole("button", { name: /Quitar logo\.png/ }).click();
  const chosen = page.getByRole("list", { name: room("attachments.selected") });
  await expect(chosen.getByRole("listitem")).toHaveCount(1);
  await expect(chosen).toContainText("brief.pdf");
});

test("a storage failure keeps the text, drops the files and says so", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page);
  await page.request.post(`${mock}/__chat/storage-mode`, { data: { mode: "upload-error" } });
  await page.locator('input[type="file"]').setInputFiles([pdf]);
  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Con fallo de almacenamiento");
  await composer.press("Enter");
  await expect(
    page.getByRole("alert").filter({ hasText: room("errors.attachments_failed") }),
  ).toBeVisible();
});

test("a visitor room offers no attachments", async ({ page }) => {
  await signInAdmin(page, tag);
  await open(page, visitorRoom);
  await expect(page.getByRole("button", { name: room("attachments.attach") })).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("the closer chat accepts files too", async ({ page }) => {
  await signInCloser(page, tag);
  await page.goto("/es/crm/chat");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles([png]);
  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Mi logo");
  await composer.press("Enter");
  await expect(page.getByRole("log").getByRole("link", { name: /logo\.png/ })).toBeVisible();
});

test("the endpoint rejects bad bodies and anonymous callers", async ({ page, browser }) => {
  await signInAdmin(page, tag);
  const empty = await page.request.post("/api/chat/attachments", {
    multipart: { conversationId: closerRoom, body: "x" },
  });
  expect(empty.status()).toBe(400);
  const badRoom = await page.request.post("/api/chat/attachments", {
    multipart: { conversationId: "no", body: "x", files: pdf },
  });
  expect(badRoom.status()).toBe(400);
  const foreign = await page.request.post("/api/chat/attachments", {
    multipart: { conversationId: visitorRoom, body: "x", files: pdf },
    headers: { origin: "https://evil.example" },
  });
  expect(foreign.status()).toBe(403);

  const anonymous = await browser.newContext();
  const denied = await anonymous.request.post("/api/chat/attachments", {
    multipart: { conversationId: closerRoom, body: "x", files: pdf },
  });
  expect(denied.status()).toBe(401);
  await anonymous.close();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 800 },
]) {
  test(`the composer with files passes axe at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signInAdmin(page, tag);
    await open(page);
    await page.locator('input[type="file"]').setInputFiles([pdf, png]);
    await expect(page.getByRole("list", { name: room("attachments.selected") })).toBeVisible();
    await expectClean(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}
