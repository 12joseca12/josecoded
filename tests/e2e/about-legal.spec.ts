import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  about: {
    head: { title: string; accent: string };
    stack: { title: string; groups: Record<string, string> };
    closing: { cta: string; cv: string; links: { linkedin: string } };
    actions: { cvEn: string };
  };
  services: { bento: { proof: { stack: string }; hiring: { trajectory: string } } };
  legal: { draft: { title: string }; summary: { title: string }; toc: { label: string } };
  footer: { legalLabel: string };
  contactPage: { form: { consentLink: string } };
};

interface Node {
  "@type": string;
  [key: string]: unknown;
}

async function readNodes(page: Page): Promise<Node[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text) => (JSON.parse(text) as { "@graph": Node[] })["@graph"]);
}

async function top(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("element has no box");
  return box.y;
}

const legalPages = [
  { slug: "aviso-legal", title: "Aviso legal" },
  { slug: "privacidad", title: "Política de privacidad" },
  { slug: "cookies", title: "Política de cookies" },
] as const;

for (const width of [1440, 390]) {
  test(`/es/sobre-mi passes axe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/es/sobre-mi");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  for (const entry of legalPages) {
    test(`/es/legal/${entry.slug} passes axe at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/es/legal/${entry.slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(entry.title);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }
}

test("/es/sobre-mi has the person's h1, the stack groups and no raw placeholders", async ({
  page,
}) => {
  await page.goto("/es/sobre-mi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${es.about.head.title} ${es.about.head.accent}`,
  );
  const stack = page.locator("#stack");
  await expect(stack.getByRole("heading", { level: 2 })).toHaveText(es.about.stack.title);
  await expect(stack.getByRole("heading", { level: 3 })).toHaveText(
    Object.values(es.about.stack.groups),
  );
  expect(await page.locator("body").innerText()).not.toContain("{{DATO");
  const timeline = page.locator("#trayectoria");
  await expect(timeline.getByRole("heading", { level: 3 }).first()).toContainText("React Native");
  await expect(timeline).toContainText("3CatInfo");
  await expect(timeline).toContainText("NextRaket");
});

test("/es/sobre-mi puts the CV first, then the career, then the stack, then the values", async ({
  page,
}) => {
  await page.goto("/es/sobre-mi");
  const cv = page.getByRole("link", { name: es.about.closing.cv });
  const cvTop = await top(cv);
  const careerTop = await top(page.locator("#trayectoria"));
  const stackTop = await top(page.locator("#stack"));
  const valuesTop = await top(page.locator("#como-trabajo"));
  expect(cvTop).toBeLessThan(careerTop);
  expect(careerTop).toBeLessThan(stackTop);
  expect(stackTop).toBeLessThan(valuesTop);
  await expect(page.locator("#historia, #fortalezas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("José Carlos Sánchez García");
  await expect(page.getByRole("main")).toContainText("3CatInfo");
  await expect(page.getByRole("main")).toContainText("Alten");
});

test("/es/sobre-mi keeps the CV above the fold on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/es/sobre-mi");
  await expect(page.getByRole("link", { name: es.about.closing.cv })).toBeInViewport();
});

test("/es/sobre-mi offers the English CV and hides the availability line without data", async ({
  page,
  request,
}) => {
  await page.goto("/es/sobre-mi");
  const english = page.getByRole("link", { name: es.about.actions.cvEn });
  await expect(english).toHaveAttribute("href", "/cv/cv-jose-carlos-sanchez-en.pdf");
  await expect(english).toHaveAttribute("download", "");
  await expect(english).toHaveAttribute("lang", "en");
  expect((await request.get("/cv/cv-jose-carlos-sanchez-en.pdf")).status()).toBe(200);
  await expect(page.locator("main")).not.toContainText("Modalidad");
});

test("/es/sobre-mi publishes a complete Person with one spelling of the name", async ({ page }) => {
  await page.goto("/es/sobre-mi");
  const person = (await readNodes(page)).find((node) => node["@type"] === "Person");
  expect(person).toMatchObject({
    name: "José Carlos Sánchez García",
    alternateName: ["josecoded"],
    knowsLanguage: ["es", "en"],
    worksFor: { name: "Alten" },
  });
  expect(person?.knowsAbout).toContain("React Native");
  expect(JSON.stringify(person)).not.toContain("{{DATO");
  const sameAs = person?.sameAs as string[];
  expect(sameAs.every((link) => link.startsWith("https://www.linkedin.com/"))).toBe(true);
});

test("/es/sobre-mi offers the Spanish CV download and links the profiles", async ({
  page,
  request,
}) => {
  await page.goto("/es/sobre-mi");
  const cv = page.getByRole("link", { name: es.about.closing.cv });
  await expect(cv).toHaveAttribute("href", "/cv/cv-jose-carlos-sanchez-es.pdf");
  await expect(cv).toHaveAttribute("download", "");
  const file = await request.get("/cv/cv-jose-carlos-sanchez-es.pdf");
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain("application/pdf");
  const linkedin = page.getByRole("link", { name: es.about.closing.links.linkedin });
  await expect(linkedin).toHaveAttribute("href", /linkedin\.com\/in\//);
  await expect(linkedin).toHaveAttribute("rel", /\bme\b/);
  await expect(linkedin).toHaveAttribute("target", "_blank");
});

test("/es/sobre-mi sends the primary action to the hiring contact form", async ({ page }) => {
  await page.goto("/es/sobre-mi");
  const cta = page.getByRole("link", { name: es.about.closing.cta });
  await expect(cta).toHaveAttribute("href", "/es/contacto?via=hiring#formulario");
  await cta.click();
  await expect(page).toHaveURL(/\/es\/contacto\?via=hiring/);
});

test("/es/sobre-mi publishes ProfilePage and breadcrumbs JSON-LD with a nonce", async ({
  page,
  request,
}) => {
  await page.goto("/es/sobre-mi");
  const nodes = await readNodes(page);
  const profile = nodes.find((node) => node["@type"] === "ProfilePage");
  expect(profile?.mainEntity).toEqual({ "@id": "http://localhost:3000/#person" });
  const crumbs = nodes.find((node) => node["@type"] === "BreadcrumbList");
  expect(crumbs?.itemListElement).toHaveLength(2);
  const html = await (await request.get("/es/sobre-mi")).text();
  const scripts = html.match(/<script[^>]*application\/ld\+json[^>]*>/g) ?? [];
  expect(scripts).toHaveLength(2);
  for (const tag of scripts) expect(tag).toMatch(/nonce="[^"]+"/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "profile");
});

test("the services bento links land on Sobre mí and its stack anchor", async ({ page }) => {
  await page.goto("/es/servicios");
  await page.getByRole("link", { name: es.services.bento.hiring.trajectory }).click();
  await expect(page).toHaveURL(/\/es\/sobre-mi$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/es/servicios");
  await page.getByRole("link", { name: es.services.bento.proof.stack }).click();
  await expect(page).toHaveURL(/\/es\/sobre-mi#stack$/);
  await expect(page.locator("#stack")).toBeInViewport();
});

for (const entry of legalPages) {
  test(`/es/legal/${entry.slug} is final: no draft notice, no placeholders, dated, with a working contents list`, async ({
    page,
  }) => {
    const response = await page.goto(`/es/legal/${entry.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("note")).toHaveCount(0);
    const text = await page.locator("main").innerText();
    expect(text).not.toContain("{{");
    expect(text).not.toContain("DATO");
    expect(text).not.toContain(es.legal.draft.title);
    await expect(page.locator("main")).toContainText("Actualizado el 5 de noviembre de 2026");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://josecoded.com/es/legal/${entry.slug}`,
    );
    await expect(
      page.getByRole("region", { name: es.legal.summary.title }).locator("li"),
    ).toHaveCount(5);
    const toc = page.getByRole("navigation", { name: es.legal.toc.label });
    const hrefs = await toc
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(3);
    for (const href of hrefs) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  });
}

test("the legal notice and the privacy policy name the holder with the decided data", async ({
  page,
}) => {
  for (const slug of ["aviso-legal", "privacidad"]) {
    await page.goto(`/es/legal/${slug}`);
    const main = page.locator("main");
    await expect(main).toContainText("José Carlos Sánchez García");
    await expect(main).toContainText("06011766A");
    await expect(main).toContainText("Madrid (España)");
    await expect(main).toContainText("hola@josecoded.com");
  }
});

test("the privacy policy states the retention periods and the controller", async ({ page }) => {
  await page.goto("/es/legal/privacidad");
  const main = page.locator("main");
  await expect(main).toContainText("José Carlos Sánchez García");
  await expect(main).toContainText("hola@josecoded.com");
  await expect(main).toContainText("7 días");
  await expect(main).toContainText("60 días");
  await expect(main).toContainText("90 días");
  await expect(main).toContainText("06011766A");
});

test("the cookies policy says only necessary cookies are used", async ({ page }) => {
  await page.goto("/es/legal/cookies");
  await expect(page.locator("main")).toContainText("únicamente cookies técnicas");
  await expect(page.locator("main")).toContainText("Turnstile");
  await expect(page.locator("main")).toContainText("jc_visitor");
  await expect(page.locator("main")).toContainText("7 días");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("an unknown legal page is a 404", async ({ request }) => {
  expect((await request.get("/es/legal/aviso")).status()).toBe(404);
  expect((await request.get("/es/legal/nada")).status()).toBe(404);
});

test("every footer legal link resolves", async ({ page, request }) => {
  await page.goto("/es");
  const links = page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: es.footer.legalLabel })
    .getByRole("link");
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href") ?? ""),
  );
  expect(hrefs).toEqual(legalPages.map((entry) => `/es/legal/${entry.slug}`));
  for (const href of hrefs) {
    expect((await request.get(href)).status()).toBe(200);
  }
  await links.first().click();
  await expect(page).toHaveURL(/\/es\/legal\/aviso-legal$/);
});

test("the contact form consent link opens the privacy policy", async ({ page, request }) => {
  await page.goto("/es/contacto#formulario");
  const link = page
    .locator("#formulario")
    .getByRole("link", { name: new RegExp(es.contactPage.form.consentLink) });
  const href = await link.getAttribute("href");
  expect(href).toBe("/es/legal/privacidad");
  expect((await request.get(href ?? "")).status()).toBe(200);
});
