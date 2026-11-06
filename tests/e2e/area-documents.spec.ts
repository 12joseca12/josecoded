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

const docs = (name: string) => msg(`area.docs.${name}`);
const files = (name: string) => docs(`files.${name}`);
const up = (name: string) => docs(`uploader.${name}`);

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.46" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
  await request.post(`${mock}/__area/uploads`, { data: { mode: "ok" } });
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__area/mode?tag=${tag.value}`, { data: mode });
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }) {
  await setMode(page, mode);
  await signInClient(page, tag);
  await page.goto("/es/area/documentos");
  await expect(page.getByRole("heading", { level: 1, name: docs("title") })).toBeVisible();
}

function list(page: Page) {
  return page.getByRole("region", { name: files("region") });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

const pdf = (name = "logo.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 prueba"),
});

test("the client sees the shared documents and not the team-only ones", async ({ page }) => {
  await open(page);
  const rows = list(page).getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.filter({ hasText: "Presupuesto.pdf" })).toContainText(files("uploader.jose"));
  await expect(rows.filter({ hasText: "Logotipo.png" })).toContainText(files("uploader.me"));
  await expect(rows.filter({ hasText: "Maqueta de la portada.pdf" })).toContainText(
    files("uploader.team"),
  );
  await expect(list(page).getByText("Fran")).toHaveCount(0);
  await expect(list(page).getByText("Notas internas.txt")).toHaveCount(0);
  await expect(rows.filter({ hasText: "Presupuesto.pdf" })).toContainText(/2\s?kB/);
  await expect(page.getByLabel(up("visibility"))).toHaveCount(0);
  await expectClean(page);
});

test("only the client's own documents can be deleted", async ({ page }) => {
  await open(page);
  const rows = list(page).getByRole("listitem");
  await expect(
    rows.filter({ hasText: "Presupuesto.pdf" }).getByRole("button", { name: /Borrar/ }),
  ).toHaveCount(0);
  const own = rows.filter({ hasText: "Logotipo.png" });
  await own
    .getByRole("button", { name: files("deleteFor").replace("{name}", "Logotipo.png") })
    .click();
  await expect(own.getByText(files("deleteConfirm"))).toBeVisible();
  await own.getByRole("button", { name: files("cancel") }).click();
  await expect(own.getByText(files("deleteConfirm"))).toHaveCount(0);

  await own
    .getByRole("button", { name: files("deleteFor").replace("{name}", "Logotipo.png") })
    .click();
  await own.getByRole("button", { name: files("delete"), exact: true }).click();
  await expect(list(page).getByText("Logotipo.png")).toHaveCount(0);
});

test("a download redirects to a short-lived signed url", async ({ page }) => {
  await open(page);
  const link = list(page).getByRole("link", {
    name: files("downloadFor").replace("{name}", "Presupuesto.pdf"),
  });
  const response = await page.request.get((await link.getAttribute("href")) ?? "", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
  expect(response.headers().location).toContain("/storage/v1/object/sign/project-documents/");
});

test("uploading a document adds it to the list for the client", async ({ page }) => {
  await open(page);
  await page.getByLabel(up("file"), { exact: true }).setInputFiles(pdf());
  await page.getByRole("button", { name: up("submit"), exact: true }).click();
  const row = list(page).getByRole("listitem").filter({ hasText: "logo.pdf" });
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: /Borrar/ })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: up("done") })).toHaveCount(1);
});

test("the uploader refuses missing, oversized and unsupported files before sending", async ({
  page,
}) => {
  await open(page);
  const submit = page.getByRole("button", { name: up("submit"), exact: true });
  const alert = (code: string) => page.getByRole("alert").filter({ hasText: up(`errors.${code}`) });

  await submit.click();
  await expect(alert("file_missing")).toBeVisible();

  await page.getByLabel(up("file"), { exact: true }).setInputFiles({
    name: "run.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("x"),
  });
  await submit.click();
  await expect(alert("invalid_mime")).toBeVisible();

  await page.getByLabel(up("file"), { exact: true }).setInputFiles({
    name: "gigante.zip",
    mimeType: "application/zip",
    buffer: Buffer.alloc(26214401),
  });
  await submit.click();
  await expect(alert("file_too_large")).toBeVisible();
});

test("a full project reports the quota inline", async ({ page }) => {
  await open(page);
  await page.request.post(`${mock}/__area/uploads`, { data: { mode: "quota" } });
  await page.getByLabel(up("file"), { exact: true }).setInputFiles(pdf());
  await page.getByRole("button", { name: up("submit"), exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: up("errors.project_quota_exceeded") }),
  ).toBeVisible();
});

test("a project without documents shows the empty state", async ({ page }) => {
  await open(page, { mode: "two" });
  await page
    .getByRole("navigation", { name: msg("area.home.switcher.label") })
    .getByRole("link", { name: "Tienda de cerámica" })
    .click();
  await expect(page.getByRole("heading", { name: files("empty.title") })).toBeVisible();
});

test("a failing list shows its own error with retry", async ({ page }) => {
  await open(page, { mode: "one", error: "documents" });
  await expect(page.getByRole("heading", { name: docs("error.title") })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: docs("title") })).toBeVisible();
});

test("the screen fits at 375 px and passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page);
  await expect(list(page)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
