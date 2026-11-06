import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { mockOrigin as mock, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface ImportMessages {
  title: string;
  pick: string;
  pickAgain: string;
  templateDownload: string;
  rejections: Record<string, string>;
  mapping: { missingName: string; fields: Record<string, string>; none: string };
  preview: {
    title: string;
    region: string;
    alreadyImported: string;
    neutralized: string;
    summary: string;
    verdicts: Record<string, string>;
    problems: Record<string, string>;
  };
  options: { update: string; owner: string };
  confirm: string;
  cancel: string;
  result: {
    title: string;
    created: string;
    updated: string;
    skipped: string;
    invalid: string;
    report: string;
    again: string;
  };
  errors: { failed: string };
  history: { title: string; region: string };
}

interface Messages {
  crm: { import: ImportMessages; nav: { import: string } };
}

interface CrmCall {
  kind: string;
  body?: {
    p_rows: { full_name: string; organization: string; notes: string; email: string }[];
    p_on_duplicate: string;
    p_owner_id: string;
    p_file_name: string;
  };
}

const text = (JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages).crm.import;
const navLabel = (JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages).crm.nav.import;

const cleoId = "00000000-0000-4000-8000-0000000000c1";
const daniId = "00000000-0000-4000-8000-0000000000c2";
const next = "?next=%2Fes%2Fcrm%2Fimportar";
const fixtures = "tests/e2e/fixtures/import";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.41" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

function fill(template: string, values: Record<string, number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function expectCleanAtBothWidths(page: Page) {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expectClean(page);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function importCalls(page: Page): Promise<CrmCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  const { crm } = (await response.json()) as { crm: CrmCall[] };
  return crm.filter((call) => call.kind === "import-contacts");
}

async function openAsCloser(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/importar$/);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
}

async function pick(page: Page, file: string | { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByTestId("csv-input").setInputFiles(file);
}

function rejection(page: Page, key: string) {
  return page.getByRole("alert").filter({ hasText: text.rejections[key] ?? "" });
}

async function expectPreview(page: Page) {
  await expect(page.getByRole("heading", { level: 2, name: text.preview.title })).toBeVisible();
}

function table(page: Page) {
  return page.getByRole("group", { name: text.preview.region });
}

function summary(page: Page, values: Record<string, number>) {
  return page.getByRole("status").filter({ hasText: fill(text.preview.summary, values) });
}

test("the nav lists the import and the empty screen passes axe at both widths", async ({
  page,
}) => {
  await openAsCloser(page);
  await expect(page.getByRole("link", { name: navLabel }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: text.pick })).toBeVisible();
  await expect(page.getByRole("button", { name: text.templateDownload })).toBeVisible();
  await expect(page.getByTestId("csv-input")).toHaveAttribute("accept", ".csv,text/csv");
  await expectCleanAtBothWidths(page);
});

test("the template downloads with the expected headers", async ({ page }) => {
  await openAsCloser(page);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: text.templateDownload }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("plantilla-contactos.csv");
  const path = await download.path();
  expect(readFileSync(path, "utf8")).toBe("nombre,email,telefono,empresa,tipo,notas\r\n");
});

test("a valid csv is previewed, imported under the closer and listed in the history", async ({
  page,
}) => {
  test.slow();
  await openAsCloser(page);
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  await expect(summary(page, { rows: 3, valid: 3, duplicates: 0, invalid: 0 })).toBeVisible();
  await expect(table(page).getByRole("row")).toHaveCount(4);
  await expect(table(page)).toContainText("Nora Nueva");
  await expect(table(page)).toContainText("oscar@otro.example");
  await expect(page.getByLabel(text.options.owner)).toHaveCount(0);
  await expectCleanAtBothWidths(page);

  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByRole("heading", { level: 2, name: text.result.title })).toBeVisible();
  await expect(page.getByText(fill(text.result.created, { count: 3 }))).toBeVisible();
  await expect(page.getByText(fill(text.result.invalid, { count: 0 }))).toBeVisible();
  await expect(page.getByRole("button", { name: text.result.report })).toHaveCount(0);
  await expectCleanAtBothWidths(page);

  const [call] = await importCalls(page);
  expect(call?.body?.p_owner_id).toBe(cleoId);
  expect(call?.body?.p_on_duplicate).toBe("skip");
  expect(call?.body?.p_rows.map((row) => row.full_name)).toEqual([
    "Nora Nueva",
    "Oscar Otro",
    "Paula Prueba",
  ]);
  expect(call?.body?.p_rows[1]?.notes).toBe('Nota con coma, y "comillas"');

  await page.goto("/es/crm/contactos");
  await expect(page.getByRole("table").getByRole("link", { name: "Nora Nueva" })).toBeVisible();
  await page.goto("/es/crm/importar");
  const history = page.getByRole("group", { name: text.history.region });
  await expect(history).toContainText("valid.csv");
  await expectClean(page);
});

test("a wrong extension is rejected before anything is sent", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, {
    name: "contactos.txt",
    mimeType: "text/csv",
    buffer: Buffer.from("nombre\nAna\n"),
  });
  await expect(rejection(page, "extension")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: text.preview.title })).toHaveCount(0);
  await pick(page, {
    name: "contactos.csv",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("nombre\nAna\n"),
  });
  await expect(rejection(page, "mime")).toBeVisible();
  expect(await importCalls(page)).toEqual([]);
  await expectCleanAtBothWidths(page);
});

test("an executable renamed to csv is rejected by its content", async ({ page }) => {
  await openAsCloser(page);
  const header = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  await pick(page, {
    name: "contactos.csv",
    mimeType: "text/csv",
    buffer: Buffer.concat([header, Buffer.from("This program cannot be run in DOS mode.")]),
  });
  await expect(rejection(page, "executable")).toBeVisible();
  await pick(page, {
    name: "contactos.csv",
    mimeType: "",
    buffer: Buffer.from("nombre,email\nAna,a@x.co\u0000\n"),
  });
  await expect(rejection(page, "binary")).toBeVisible();
  await pick(page, {
    name: "contactos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([0x6e, 0x6f, 0x6d, 0x62, 0x72, 0x65, 0x0a, 0x4a, 0x6f, 0x73, 0xe9, 0x0a]),
  });
  await expect(rejection(page, "encoding")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: text.preview.title })).toHaveCount(0);
  expect(await importCalls(page)).toEqual([]);
});

test("a file with too many rows or too large is rejected", async ({ page }) => {
  await openAsCloser(page);
  const rows = Array.from({ length: 501 }, (_, index) => `Contacto ${index}`).join("\n");
  await pick(page, {
    name: "muchos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`nombre\n${rows}\n`),
  });
  await expect(rejection(page, "tooManyRows")).toBeVisible();
  await pick(page, {
    name: "grande.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`nombre\n${"x".repeat(1_048_577)}\n`),
  });
  await expect(rejection(page, "tooLarge")).toBeVisible();
  await pick(page, {
    name: "vacio.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(0),
  });
  await expect(rejection(page, "empty")).toBeVisible();
  expect(await importCalls(page)).toEqual([]);
});

test("formula cells are neutralised before they reach the database", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/formulas.csv`);
  await expectPreview(page);
  await expect(page.getByText(text.preview.neutralized)).toBeVisible();
  await expect(summary(page, { rows: 2, valid: 1, duplicates: 0, invalid: 1 })).toBeVisible();
  const bad = table(page).getByRole("row").filter({ hasText: "Normal Nombre" });
  await expect(bad).toContainText(text.preview.verdicts.invalid ?? "");
  await expect(bad).toContainText(text.preview.problems.phone ?? "");
  await expectClean(page);

  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByText(fill(text.result.created, { count: 1 }))).toBeVisible();
  await expect(page.getByText(fill(text.result.invalid, { count: 1 }))).toBeVisible();
  const [call] = await importCalls(page);
  expect(call?.body?.p_rows).toHaveLength(1);
  expect(call?.body?.p_rows[0]).toMatchObject({
    full_name: `'=HYPERLINK("http://evil.example","x")`,
    organization: "'@empresa",
    notes: "'-10% de descuento",
  });
});

test("duplicates are reported and resolved with the chosen mode", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/duplicates.csv`);
  await expectPreview(page);
  await expect(summary(page, { rows: 4, valid: 2, duplicates: 2, invalid: 0 })).toBeVisible();
  await expect(table(page).getByRole("row").filter({ hasText: "Ada Repetida" })).toContainText(
    text.preview.verdicts.duplicate ?? "",
  );
  await expect(table(page).getByRole("row").filter({ hasText: "Rita Doble" })).toContainText(
    text.preview.problems.duplicateInFile ?? "",
  );
  await page.getByRole("radio", { name: new RegExp(`^${text.options.update}`) }).check();
  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByText(fill(text.result.created, { count: 2 }))).toBeVisible();
  await expect(page.getByText(fill(text.result.updated, { count: 0 }))).toBeVisible();
  await expect(page.getByText(fill(text.result.skipped, { count: 2 }))).toBeVisible();
  const [call] = await importCalls(page);
  expect(call?.body?.p_on_duplicate).toBe("update");
  expect(call?.body?.p_rows.map((row) => row.email)).toEqual([
    "ada@estudioada.example",
    "rita@example.com",
    "",
  ]);
});

test("row errors are listed and downloaded as a csv report", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/invalid.csv`);
  await expectPreview(page);
  await expect(summary(page, { rows: 4, valid: 1, duplicates: 0, invalid: 3 })).toBeVisible();
  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByText(fill(text.result.created, { count: 1 }))).toBeVisible();
  await expect(page.getByText(fill(text.result.invalid, { count: 3 }))).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: text.result.report }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("informe-errores.csv");
  const report = readFileSync(await download.path(), "utf8");
  expect(report).toContain("linea,problema,nombre,email,telefono,empresa,tipo,notas");
  expect(report).toContain(text.preview.problems.email ?? "");
  expect(report).toContain(text.preview.problems.kind ?? "");
  expect(report).toContain(text.preview.problems.fullName ?? "");
  expect(report).not.toContain("Buen Contacto");
});

test("the same file cannot be imported twice", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByRole("heading", { level: 2, name: text.result.title })).toBeVisible();
  await page.getByRole("button", { name: text.result.again }).click();
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  await expect(
    page.getByRole("alert").filter({ hasText: text.preview.alreadyImported }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: text.confirm })).toBeDisabled();
});

test("the column mapping can be changed and the name column is required", async ({ page }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  const name = page.getByLabel(text.mapping.fields.fullName ?? "", { exact: false }).first();
  await name.selectOption({ label: text.mapping.none });
  await expect(page.getByRole("alert").filter({ hasText: text.mapping.missingName })).toBeVisible();
  await expect(page.getByRole("button", { name: text.confirm })).toBeDisabled();
  await name.selectOption({ label: "nombre" });
  await expect(page.getByRole("button", { name: text.confirm })).toBeEnabled();
});

test("a failing import shows the error and keeps the preview", async ({ page, request }) => {
  await openAsCloser(page);
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  await request.post(`${mock}/__auth/import-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByRole("alert").filter({ hasText: text.errors.failed })).toBeVisible();
  await expect(page.getByRole("button", { name: text.confirm })).toBeEnabled();
  await page.getByRole("button", { name: text.cancel }).click();
  await expect(page.getByRole("button", { name: text.pick })).toBeVisible();
});

test("the admin chooses the portfolio that receives the contacts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, next);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
  await pick(page, `${fixtures}/valid.csv`);
  await expectPreview(page);
  await page.getByLabel(text.options.owner).selectOption({ label: "Dani Closer" });
  await expectPreview(page);
  await expectCleanAtBothWidths(page);
  await page.getByRole("button", { name: text.confirm }).click();
  await expect(page.getByText(fill(text.result.created, { count: 3 }))).toBeVisible();
  const [call] = await importCalls(page);
  expect(call?.body?.p_owner_id).toBe(daniId);
});
