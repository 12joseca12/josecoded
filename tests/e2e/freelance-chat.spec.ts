import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInFreelance, type Tag, withTag } from "./support/staff";

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

const chat = (path: string) => msg(`freelance.chat.${path}`);
const room = (path: string) => msg(`room.${path}`);

const freelanceRoom = "c0000000-0000-4000-8000-000000000005";
const joseId = "00000000-0000-4000-8000-0000000000a2";
const shopId = "70000000-0000-4000-8000-000000000001";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.64" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function calls(page: Page) {
  const response = await page.request.get(`${mock}/__chat/calls?tag=${tag.value}`);
  return (await response.json()) as { name: string }[];
}

test("the freelance gets a room with Jose, writes and receives by polling", async ({ page }) => {
  await signInFreelance(page, tag);
  await page.goto("/es/freelance/chat");
  await expect(page.getByRole("heading", { level: 1, name: chat("title") })).toBeVisible();
  const log = page.getByRole("log", { name: room("threadLabel") });
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.locator("[data-zone='freelance']").first()).toBeVisible();

  const composer = page.getByLabel(room("composer.label"));
  await composer.fill("Hola Jose, ¿me pasas el logotipo?");
  await composer.press("Enter");
  await expect(log).toContainText("Hola Jose, ¿me pasas el logotipo?");

  await page.request.post(`${mock}/__chat/push?tag=${tag.value}`, {
    data: { room: freelanceRoom, body: "Te lo subo ahora", author: joseId },
  });
  await expect(log).toContainText("Te lo subo ahora");

  const made = await calls(page);
  expect(made.some((call) => call.name === "ensure_my_conversation")).toBe(true);
  expect(made.filter((call) => call.name === "message_sent")).toHaveLength(1);
  await expectClean(page);
});

test("the room shows Jose and the freelance and no Nexo switch or member editor", async ({
  page,
}) => {
  await signInFreelance(page, tag);
  await page.goto("/es/freelance/chat");
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Quitar/ })).toHaveCount(0);
  const members = page.getByRole("region", { name: room("members.title") });
  await expect(members.getByText("Fran Freelance")).toBeVisible();
  await expect(members.getByText("Jose Enrolled")).toBeVisible();
  await expect(members.getByText("Carla")).toHaveCount(0);
});

test("a task in the URL pre-fills the message about it", async ({ page }) => {
  await signInFreelance(page, tag);
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: { mode: "one" } });
  await page.goto("/es/freelance/chat?tarea=71000000-0000-4000-8000-000000000001");
  await expect(page.getByLabel(room("composer.label"))).toHaveValue(
    chat("taskDraft").replace("{title}", "Maquetar la portada"),
  );
  await page.goto("/es/freelance/chat?tarea=71000000-0000-4000-8000-0000000000ee");
  await expect(page.getByLabel(room("composer.label"))).toHaveValue("");
});

test("the project links to the chat and to the chat about an own task", async ({ page }) => {
  await signInFreelance(page, tag);
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: { mode: "one" } });
  await page.goto(`/es/freelance/proyectos/${shopId}`);
  await expect(page.getByRole("link", { name: chat("openFromProject") })).toHaveAttribute(
    "href",
    "/es/freelance/chat",
  );
  await expect(page.getByRole("link", { name: chat("askAboutTask") }).first()).toHaveAttribute(
    "href",
    /\/es\/freelance\/chat\?tarea=71000000/,
  );
});

test("a failing room shows the retry state", async ({ page }) => {
  await signInFreelance(page, tag);
  await page.request.post(`${mock}/__chat/mode?tag=${tag.value}`, {
    data: { messages: "error" },
  });
  await page.goto("/es/freelance/chat");
  await expect(page.getByRole("button", { name: chat("error.retry") })).toBeVisible();
});

test("the chat has no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signInFreelance(page, tag);
  await page.goto("/es/freelance/chat");
  await expect(page.getByRole("log", { name: room("threadLabel") })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
