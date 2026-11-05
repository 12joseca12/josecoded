import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  meta: { titleTemplate: string };
  seo: {
    person: {
      name: string;
      givenName: string;
      familyName: string;
      alternateName: string;
      jobTitle: string;
    };
  };
};

interface Graph {
  "@graph": { "@type": string; "@id": string; [key: string]: unknown }[];
}

const brandSuffix = es.meta.titleTemplate.replace("%s", "");
const publicRoutes = [
  "/es",
  "/es/servicios",
  "/es/servicios/freelance",
  "/es/servicios/a-medida",
  "/es/como-trabajo",
  "/es/proyectos",
  "/es/sobre-mi",
];
const devRoutes = [
  "/es/dev/ui",
  "/es/dev/ui/tokens",
  "/es/dev/ui/prose",
  "/es/dev/ui/errors",
  "/es/dev/scroll",
];

async function readGraph(page: Page): Promise<Graph> {
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  return JSON.parse(raw ?? "null") as Graph;
}

for (const route of publicRoutes) {
  test(`${route} has one h1, a canonical, the title template and social tags`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://josecoded.com${route}`,
    );
    const title = await page.title();
    expect(title.endsWith(brandSuffix)).toBe(true);
    expect(title.split(brandSuffix)).toHaveLength(2);
    expect(title.length).toBeLessThanOrEqual(60);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeGreaterThan(50);
    expect(description?.length).toBeLessThanOrEqual(160);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  });
}

for (const route of devRoutes) {
  test(`${route} is noindex`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("a non-production host is noindex in header and meta on public routes", async ({ page }) => {
  const response = await page.goto("/es");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("robots.txt disallows everything on non-production hosts", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("User-Agent: *");
  expect(body).toContain("Disallow: /");
  expect(body).not.toContain("GPTBot");
  expect(body).not.toContain("Sitemap:");
});

test("sitemap.xml lists the public routes that have content", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const route of [...publicRoutes, "/es/contacto"].filter(
    (path) => path !== "/es/proyectos",
  )) {
    expect(body).toContain(`<loc>http://localhost:3000${route}</loc>`);
  }
  expect(body).not.toContain("/es/proyectos");
  expect(body).not.toContain("/es/legal");
  expect(body).not.toContain("/dev");
});

test("/ answers a permanent 308 to /es", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/es$/);
});

test("llms.txt describes the same entity as the JSON-LD", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const body = await response.text();
  expect(body).toContain(es.seo.person.jobTitle);
  expect(body).toContain("Madrid");
  expect(body).toContain(es.seo.person.alternateName);
  expect(body).toContain(es.seo.person.name);
  for (const email of ["hola@", "freelance@", "proyectos@"]) {
    expect(body).toContain(`${email}josecoded.com`);
  }
});

test("llms.txt omits the provisional prices", async ({ request }) => {
  const body = await (await request.get("/llms.txt")).text();
  expect(body).not.toMatch(/Tarifa por hora|Presupuesto por tarea/);
  expect(body).not.toMatch(/\b0{2,3}\b/);
  expect(body).not.toContain("€");
});

test("JSON-LD parses and carries the Person and the WebSite", async ({ page }) => {
  await page.goto("/es");
  const graph = await readGraph(page);
  const person = graph["@graph"].find((node) => node["@type"] === "Person");
  const website = graph["@graph"].find((node) => node["@type"] === "WebSite");
  expect(person).toMatchObject({
    name: es.seo.person.name,
    givenName: es.seo.person.givenName,
    familyName: es.seo.person.familyName,
    alternateName: [es.seo.person.alternateName],
    email: "hola@josecoded.com",
    sameAs: ["https://www.linkedin.com/in/jos%C3%A9-carlos-s%C3%A1nchez-garc%C3%ADa-7019072a9/"],
    jobTitle: es.seo.person.jobTitle,
    address: { addressLocality: "Madrid", addressCountry: "ES" },
  });
  expect(person?.["@id"]).toMatch(/\/#person$/);
  expect(website).toMatchObject({ inLanguage: "es", publisher: { "@id": person?.["@id"] } });
});
