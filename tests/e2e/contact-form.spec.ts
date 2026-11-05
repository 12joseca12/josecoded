import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

interface FormMessages {
  ways: Record<"contratacion" | "freelance" | "project", { label: string }>;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  consentLink: string;
  submit: string;
  sent: { title: string };
  quota: { title: string };
  failed: { title: string };
  verificationFailed: { title: string };
  errors: Record<"way_required" | "email_invalid", string>;
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  contactPage: { form: FormMessages };
};
const form = es.contactPage.form;
const mock = `http://localhost:${process.env.MOCK_BACKEND_PORT ?? 3199}`;
const clientIp = "203.0.113.7";

interface MockCalls {
  rpc: { args: Record<string, unknown>; authorization: string | null }[];
  siteverify: Record<string, string>[];
}

test.use({ extraHTTPHeaders: { "cf-connecting-ip": clientIp } });

test.beforeEach(async ({ request }) => {
  await request.post(`${mock}/__reset`);
});

async function calls(page: Page): Promise<MockCalls> {
  const response = await page.request.get(`${mock}/__calls`);
  return (await response.json()) as MockCalls;
}

async function open(page: Page, query = "") {
  await page.goto(`/es/contacto${query}#formulario`);
  const section = page.locator("#formulario");
  await expect(section.locator("form")).toBeVisible();
  await expect(section.locator("[data-fake-turnstile]")).toBeAttached();
  await page.waitForTimeout(150);
  return section;
}

async function fillValid(page: Page, email = "ada@example.com") {
  const section = page.locator("#formulario");
  await section.getByLabel(form.ways.freelance.label).check({ force: true });
  await section.getByLabel(form.nameLabel).fill("Ada Lovelace");
  await section.getByLabel(form.emailLabel).fill(email);
  await section.getByLabel(form.messageLabel).fill("Necesito una auditoría de mi app.");
  await section.getByLabel(new RegExp(form.consentLink)).check();
}

const sentFocus = (page: Page) =>
  page.locator("#formulario div[tabindex='-1']").filter({ hasText: form.sent.title });

const submit = (page: Page) => page.getByRole("button", { name: form.submit });

test("sends a lead with the hashed ip and verified token", async ({ page }) => {
  await open(page);
  await fillValid(page);
  await submit(page).click();

  await expect(sentFocus(page)).toBeFocused();
  await expect(page.locator("#formulario form")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "freelance@josecoded.com" })).toBeVisible();

  const seen = await calls(page);
  expect(seen.siteverify).toHaveLength(1);
  expect(seen.siteverify[0]).toMatchObject({
    secret: "test-turnstile-secret",
    response: "mock-token",
    remoteip: clientIp,
  });
  expect(seen.siteverify[0]?.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
  expect(seen.rpc).toHaveLength(1);
  const [lead] = seen.rpc;
  expect(lead?.authorization).toBe("Bearer test-service-role-key");
  expect(lead?.args).toMatchObject({
    p_source: "form",
    p_via: "freelance",
    p_full_name: "Ada Lovelace",
    p_email: "ada@example.com",
    p_consent: true,
    p_locale: "es",
    p_page_path: "/es/contacto",
  });
  const expectedHash = createHmac("sha256", "test-ip-hash-secret").update(clientIp).digest("hex");
  expect(lead?.args.p_ip_hash).toBe(expectedHash);
  expect(JSON.stringify(lead?.args)).not.toContain(clientIp);
});

test("shows errors, announces them and focuses the first invalid field", async ({ page }) => {
  const section = await open(page);
  await submit(page).click();

  await expect(section.getByRole("alert").first()).toContainText("campos por revisar");
  const radios = section.getByRole("radio");
  await expect(radios.first()).toBeFocused();
  await expect(section.getByText(form.errors.way_required)).toBeVisible();
  await expect(section.getByLabel(form.nameLabel)).toHaveAttribute("aria-invalid", "true");
  await expect(section.getByLabel(form.emailLabel)).toHaveAttribute("aria-describedby", /.+/);
  await expect(section.getByLabel(new RegExp(form.consentLink))).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await section.getByLabel(form.ways.freelance.label).check({ force: true });
  await submit(page).click();
  await expect(section.getByLabel(form.nameLabel)).toBeFocused();

  await section.getByLabel(form.nameLabel).fill("Ada");
  await expect(section.getByLabel(form.nameLabel)).not.toHaveAttribute("aria-invalid", "true");
  await section.getByLabel(form.emailLabel).fill("nope");
  await submit(page).click();
  await expect(section.getByLabel(form.emailLabel)).toBeFocused();
  await expect(section.getByText(form.errors.email_invalid)).toBeVisible();
  expect((await calls(page)).rpc).toHaveLength(0);
});

test("quota error offers the email of the chosen way", async ({ page }) => {
  const section = await open(page);
  await fillValid(page, "quota@example.com");
  await submit(page).click();

  const notice = section.getByRole("alert").filter({ hasText: form.quota.title });
  await expect(notice).toBeFocused();
  await expect(notice.getByRole("link", { name: "freelance@josecoded.com" })).toHaveAttribute(
    "href",
    "mailto:freelance@josecoded.com",
  );
  await expect(section.getByLabel(form.nameLabel)).toHaveValue("Ada Lovelace");
});

test("generic error keeps the data and can be retried", async ({ page }) => {
  const section = await open(page);
  await fillValid(page, "down@example.com");
  await submit(page).click();
  await expect(section.getByRole("alert").filter({ hasText: form.failed.title })).toBeVisible();

  await section.getByLabel(form.emailLabel).fill("ada@example.com");
  await page.waitForTimeout(150);
  await submit(page).click();
  await expect(page.getByRole("heading", { name: form.sent.title })).toBeVisible();
});

test("a rejected verification asks to repeat it", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("fakeTurnstileToken", "bad-token");
  });
  const section = await open(page);
  await fillValid(page);
  await submit(page).click();
  await expect(
    section.getByRole("alert").filter({ hasText: form.verificationFailed.title }),
  ).toBeVisible();
  expect((await calls(page)).rpc).toHaveLength(0);
});

test("a filled honeypot looks like success and stores nothing", async ({ page }) => {
  await open(page);
  await fillValid(page);
  await page.locator('input[name="homepage"]').evaluate((node: HTMLInputElement) => {
    node.value = "https://spam.example";
  });
  await submit(page).click();
  await expect(page.getByRole("heading", { name: form.sent.title })).toBeVisible();
  const seen = await calls(page);
  expect(seen.rpc).toHaveLength(0);
  expect(seen.siteverify).toHaveLength(0);
});

test("can be completed with the keyboard alone", async ({ page }) => {
  await open(page);
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Ada Lovelace");
  await page.keyboard.press("Tab");
  await page.keyboard.type("ada@example.com");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Mensaje por teclado.");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  for (let step = 0; step < 6; step++) {
    if (await submit(page).evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(submit(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sentFocus(page)).toBeFocused();
  const [lead] = (await calls(page)).rpc;
  expect(lead?.args.p_via).toBe("freelance");
});

test.describe("preselection", () => {
  const cases: [string, string][] = [
    ["?via=freelance", "freelance"],
    ["?via=hiring", "contratacion"],
    ["?via=pack&pack=app-movil", "project"],
    ["?pack=app-movil", "project"],
    ["?via=project", "project"],
    ["?offer=web-negocio&extras=seo", "project"],
  ];
  for (const [query, way] of cases) {
    test(`${query} checks ${way}`, async ({ page }) => {
      const section = await open(page, query);
      await expect(
        section.getByLabel(form.ways[way as keyof FormMessages["ways"]].label),
      ).toBeChecked();
    });
  }

  test("the chosen offer and extras travel as lead fields", async ({ page }) => {
    await open(page, "?via=project&offer=web-negocio&extras=seo,payments");
    const section = page.locator("#formulario");
    await section.getByLabel(form.nameLabel).fill("Ada");
    await section.getByLabel(form.emailLabel).fill("ada@example.com");
    await section.getByLabel(form.messageLabel).fill("Quiero este nivel.");
    await section.getByLabel(new RegExp(form.consentLink)).check();
    await submit(page).click();
    await expect(page.getByRole("heading", { name: form.sent.title })).toBeVisible();
    const [lead] = (await calls(page)).rpc;
    expect(lead?.args.p_via).toBe("project");
    expect(lead?.args.p_page_path).toBe("/es/contacto");
    expect(lead?.args.p_offer).toBe("web-negocio");
    expect(lead?.args.p_extras).toEqual(["payments", "seo"]);
  });
});

for (const width of [1440, 375]) {
  test(`has no axe violations empty, with errors and sent at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const scan = async () => {
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    };
    await scan();
    await submit(page).click();
    await expect(page.locator("#formulario").getByRole("alert").first()).toBeVisible();
    await scan();
    await fillValid(page);
    await submit(page).click();
    await expect(page.getByRole("heading", { name: form.sent.title })).toBeVisible();
    await scan();
  });
}
