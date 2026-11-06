import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin, signInAdmin, type Tag, withTag } from "./support/staff";

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

const d = (name: string) => msg(`admin.projects.detail.${name}`);
const files = (name: string) => d(`docs.files.${name}`);
const up = (name: string) => d(`docs.uploader.${name}`);

const path = "/es/admin/proyectos/60000000-0000-4000-8000-000000000001?tab=documentos";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.100" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mockOrigin}/__auth/reset?tag=${tag.value}`);
  await request.post(`${mockOrigin}/__auth/documents-storage-mode`, { data: { mode: "ok" } });
});

async function openDocuments(page: Page) {
  await signInAdmin(page, tag, `?next=${encodeURIComponent(path)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tienda de Carla" })).toBeVisible();
  await expect(page.getByRole("heading", { name: up("title") })).toBeVisible();
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function storage(page: Page) {
  const response = await page.request.get(`${mockOrigin}/__auth/documents-storage`);
  return (await response.json()) as { kind: string; path?: string; paths?: string[] }[];
}

function list(page: Page) {
  return page.getByRole("region", { name: files("region") });
}

const pdf = (name = "propuesta.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 prueba"),
});

test("the documents tab lists the files with their visibility and passes axe", async ({ page }) => {
  await openDocuments(page);
  const rows = list(page).getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: "Contrato firmado.pdf" })).toContainText(
    files("visibility.client"),
  );
  await expect(rows.filter({ hasText: "Notas internas.txt" })).toContainText(
    files("visibility.team"),
  );
  await expect(rows.filter({ hasText: "Contrato firmado.pdf" })).toContainText(/470,7\s?kB/);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
});

test("a download redirects to a short lived signed url", async ({ page }) => {
  await openDocuments(page);
  const link = list(page).getByRole("link", {
    name: files("downloadFor").replace("{name}", "Contrato firmado.pdf"),
  });
  const href = await link.getAttribute("href");
  const response = await page.request.get(href ?? "", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers().location).toContain("/storage/v1/object/sign/project-documents/");
});

test("uploading a team only document adds it to the list", async ({ page }) => {
  await openDocuments(page);
  await page.getByLabel(up("file"), { exact: true }).setInputFiles(pdf());
  await page.getByLabel(up("visibility")).selectOption("team");
  await page.getByRole("button", { name: up("submit"), exact: true }).click();

  const row = list(page).getByRole("listitem").filter({ hasText: "propuesta.pdf" });
  await expect(row).toBeVisible();
  await expect(row).toContainText(files("visibility.team"));
  await expect(page.getByRole("status").filter({ hasText: up("done") })).toHaveCount(1);
  const calls = await storage(page);
  expect(calls.some((call) => call.kind === "upload" && call.path?.startsWith("projects/"))).toBe(
    true,
  );
});

test("the uploader refuses missing, oversized and unsupported files before sending", async ({
  page,
}) => {
  await openDocuments(page);
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
  expect(
    (await storage(page)).filter(
      (call) =>
        call.kind === "upload" &&
        call.path?.startsWith("projects/60000000-0000-4000-8000-000000000001/"),
    ),
  ).toHaveLength(0);
});

test("a storage failure and a quota refusal show their messages", async ({ page }) => {
  await openDocuments(page);
  await page.request.post(`${mockOrigin}/__auth/documents-storage-mode`, {
    data: { mode: "upload-error" },
  });
  await page.getByLabel(up("file"), { exact: true }).setInputFiles(pdf());
  await page.getByRole("button", { name: up("submit"), exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: up("errors.storage_failed") }),
  ).toBeVisible();

  await page.request.post(`${mockOrigin}/__auth/documents-storage-mode`, { data: { mode: "ok" } });
  await page.request.post(`${mockOrigin}/__auth/documents-storage-mode`, {
    data: { mode: "quota" },
  });
  await page.getByLabel(up("file"), { exact: true }).setInputFiles(pdf("otra.pdf"));
  await page.getByRole("button", { name: up("submit"), exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: up("errors.project_quota_exceeded") }),
  ).toBeVisible();
  const calls = await storage(page);
  expect(calls.some((call) => call.kind === "remove")).toBe(true);
  await expect(list(page).getByRole("listitem")).toHaveCount(2);
});

test("deleting asks for confirmation, removes the row and the stored object", async ({ page }) => {
  await openDocuments(page);
  const name = "Notas internas.txt";
  await page.getByRole("button", { name: files("deleteFor").replace("{name}", name) }).click();
  await page.getByRole("button", { name: files("cancel") }).click();
  await expect(list(page).getByRole("listitem")).toHaveCount(2);

  await page.getByRole("button", { name: files("deleteFor").replace("{name}", name) }).click();
  await list(page)
    .getByRole("group", { name: files("delete") })
    .getByRole("button", { name: files("delete") })
    .click();
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await expect(
    page.getByRole("status").filter({ hasText: files("deleted").replace("{name}", name) }),
  ).toHaveCount(1);
  expect((await storage(page)).some((call) => call.kind === "remove")).toBe(true);
});

test("without documents the tab shows the empty state", async ({ page }) => {
  await signInAdmin(
    page,
    tag,
    `?next=${encodeURIComponent("/es/admin/proyectos/60000000-0000-4000-8000-000000000002?tab=documentos")}`,
  );
  await expect(page.getByRole("heading", { name: files("empty.title") })).toBeVisible();
  await expectNoViolations(page);
});

test("a cross site upload is refused", async ({ page }) => {
  await openDocuments(page);
  const response = await page.request.post("/api/projects/documents", {
    headers: { origin: "https://evil.example" },
    multipart: { projectId: "60000000-0000-4000-8000-000000000001", file: pdf() },
  });
  expect(response.status()).toBe(403);
});
