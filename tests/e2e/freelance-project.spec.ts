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

const project = (name: string) => msg(`freelance.project.${name}`);
const shopId = "70000000-0000-4000-8000-000000000001";
const shopName = "Tienda de Carla";

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.43" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
  await request.post(`${mock}/__freelance/uploads`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, { data: mode });
}

async function open(page: Page, mode: Record<string, unknown> = { mode: "one" }) {
  await setMode(page, mode);
  await signInFreelance(page, tag);
  await page.goto(`/es/freelance/proyectos/${shopId}`);
  await expect(page.getByRole("heading", { level: 1, name: shopName })).toBeVisible();
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function row(page: Page, title: string) {
  return page.getByRole("listitem").filter({ hasText: title });
}

test("the project shows the brief, the phase, the progress and no client or offer", async ({
  page,
}) => {
  await open(page);
  await expect(page.getByText("Tienda pequeña con catálogo y contacto.")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  await expect(page.locator("[aria-current='step']")).toContainText(msg("area.phases.build"));
  await expect(page.getByText("Carla Client")).toHaveCount(0);
  await expect(page.getByText(msg("offersPage.tiers.web-negocio.name"))).toHaveCount(0);
  await expectClean(page);
});

test("an own task moves through the status menu and the others have no menu", async ({ page }) => {
  await open(page);
  const mine = row(page, "Maquetar la portada");
  const group = mine.getByRole("group", {
    name: project("tasks.menu.group").replace("{title}", "Maquetar la portada"),
  });
  await expect(group.getByRole("button", { name: project("tasks.status.doing") })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await group.getByRole("button", { name: project("tasks.status.done") }).click();
  await expect(group.getByRole("button", { name: project("tasks.status.done") })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const changed = project("tasks.menu.changed")
    .replace("{title}", "Maquetar la portada")
    .replace("{status}", project("tasks.status.done"));
  await expect(page.getByRole("status").filter({ hasText: changed })).toBeVisible();

  const theirs = row(page, "Enviar el logotipo");
  await expect(theirs.getByRole("group")).toHaveCount(0);
  await expect(theirs.getByText(project("tasks.client"), { exact: true })).toBeVisible();
  await expect(theirs.getByText("Carla")).toHaveCount(0);
  await expect(row(page, "Revisar textos").getByRole("group")).toHaveCount(0);
});

test("a task that is no longer mine says so and the list reloads", async ({ page }) => {
  await open(page);
  const mine = row(page, "Preparar el catálogo");
  await page.request.post(`${mock}/__freelance/mode?tag=${tag.value}`, {
    data: { taskError: "stale" },
  });
  await mine.getByRole("button", { name: project("tasks.status.doing") }).click();
  await expect(mine.getByRole("alert")).toContainText(project("tasks.menu.errors.stale"));
});

test("the documents are the team ones and the own deliveries, never the client files", async ({
  page,
}) => {
  await open(page);
  const files = page.getByRole("region", { name: project("files.region") });
  await expect(files.getByText("Notas del equipo.txt")).toBeVisible();
  await expect(files.getByText("Entrega portada.pdf")).toBeVisible();
  await expect(files.getByText("Contrato firmado.pdf")).toHaveCount(0);
  await expect(files.getByText("Logotipo del cliente.png")).toHaveCount(0);
  await expect(
    files.getByRole("listitem").filter({ hasText: "Entrega portada.pdf" }),
  ).toContainText(msg("area.docs.files.uploader.me"));
  await expect(
    files
      .getByRole("listitem")
      .filter({ hasText: "Notas del equipo.txt" })
      .getByRole("button", { name: /Borrar/ }),
  ).toHaveCount(0);
});

test("a delivery uploads for the client and cannot be marked team only", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("heading", { name: project("files.uploader.title") })).toBeVisible();
  await expect(page.getByLabel(msg("area.docs.uploader.visibility"))).toHaveCount(0);
  await page.getByLabel(msg("area.docs.uploader.file"), { exact: true }).setInputFiles({
    name: "entrega.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 prueba"),
  });
  await page.getByRole("button", { name: project("files.uploader.submit"), exact: true }).click();
  const delivered = page
    .getByRole("region", { name: project("files.region") })
    .getByRole("listitem")
    .filter({ hasText: "entrega.pdf" });
  await expect(delivered).toBeVisible();
  const response = await page.request.get(`${mock}/__freelance/uploads`);
  const uploads = (await response.json()) as { name: string; registeredVisibility: string }[];
  expect(uploads.map((entry) => [entry.name, entry.registeredVisibility])).toEqual([
    ["entrega.pdf", "client"],
  ]);
});

test("the project links are listed", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("link", { name: /Versión de pruebas/ })).toHaveAttribute(
    "href",
    "https://staging.example.com/tienda",
  );
});

test("a project that is not mine or a malformed id is a 404", async ({ page }) => {
  await setMode(page, { mode: "one" });
  await signInFreelance(page, tag);
  for (const target of [
    "/es/freelance/proyectos/70000000-0000-4000-8000-0000000000ff",
    "/es/freelance/proyectos/nope",
  ]) {
    await page.goto(target);
    await expect(
      page.getByRole("heading", { level: 1, name: msg("errors.notFound.title") }),
    ).toBeVisible();
  }
});

test("a failing task query shows the retry state and keeps the rest", async ({ page }) => {
  await setMode(page, { mode: "one", error: "tasks" });
  await signInFreelance(page, tag);
  await page.goto(`/es/freelance/proyectos/${shopId}`);
  await expect(page.getByRole("heading", { level: 1, name: shopName })).toBeVisible();
  await expect(page.getByRole("button", { name: project("error.retry") })).toBeVisible();
  await expect(page.getByText("Notas del equipo.txt")).toBeVisible();
});

test("the project has no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);
});
