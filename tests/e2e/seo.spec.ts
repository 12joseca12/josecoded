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
  "/es/servicios/auditoria",
  "/es/como-trabajo",
  "/es/proyectos",
  "/es/proyectos/3catinfo",
  "/es/proyectos/3cat",
  "/es/proyectos/nextraket",
  "/es/proyectos/josecoded",
  "/es/sobre-mi",
  "/es/blog",
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

const ogRoutes: Record<string, string> = {
  "/es": "home",
  "/es/servicios": "services",
  "/es/servicios/freelance": "freelance",
  "/es/servicios/a-medida": "custom",
  "/es/como-trabajo": "how",
  "/es/sobre-mi": "about",
  "/es/contacto": "contact",
};

for (const [route, card] of Object.entries(ogRoutes)) {
  test(`${route} declares its own Open Graph card and the image answers png`, async ({
    page,
    request,
  }) => {
    await page.goto(route);
    const image = `https://josecoded.com/og/es-${card}.png`;
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", image);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      "1200",
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      "content",
      "630",
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      /José Carlos Sánchez García · josecoded$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", image);
    const response = await request.get(`/og/es-${card}.png`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const body = await response.body();
    expect(body.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
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
  for (const route of [...publicRoutes, "/es/contacto"]) {
    expect(body).toContain(`<loc>http://localhost:3000${route}</loc>`);
  }
  expect(body).toContain("<loc>http://localhost:3000/es/legal/aviso-legal</loc>");
  expect(body).toContain("<loc>http://localhost:3000/es/legal/privacidad</loc>");
  expect(body).not.toContain("/es/legal/cookies");
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

const breadcrumbRoutes = [
  ...publicRoutes.filter((route) => route !== "/es"),
  "/es/contacto",
  "/es/legal/aviso-legal",
  "/es/legal/privacidad",
  "/es/legal/cookies",
];

interface ListItem {
  "@type": string;
  position: number;
  name: string;
  item: string;
}

async function readNodes(page: Page): Promise<{ "@type": string; [key: string]: unknown }[]> {
  const raws = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raws.flatMap((raw) => (JSON.parse(raw) as Graph)["@graph"]);
}

for (const route of breadcrumbRoutes) {
  test(`${route} has exactly one valid BreadcrumbList and nonced scripts without prices`, async ({
    page,
  }) => {
    await page.goto(route);
    const nodes = await readNodes(page);
    const lists = nodes.filter((node) => node["@type"] === "BreadcrumbList");
    expect(lists).toHaveLength(1);
    const items = lists[0]?.itemListElement as ListItem[];
    expect(items.length).toBeGreaterThanOrEqual(2);
    items.forEach((entry, index) => {
      expect(entry["@type"]).toBe("ListItem");
      expect(entry.position).toBe(index + 1);
      expect(entry.name.length).toBeGreaterThan(0);
    });
    const origin = new URL(items[0]?.item ?? "").origin;
    expect(items[0]?.item).toBe(`${origin}/es`);
    expect(items.at(-1)?.item).toBe(`${origin}${route}`);

    const scripts = page.locator('script[type="application/ld+json"]');
    const nonces = await scripts.evaluateAll((tags) => tags.map((tag) => tag.nonce));
    expect(nonces.length).toBeGreaterThan(0);
    expect(nonces.every((nonce) => nonce.length > 0)).toBe(true);

    const raw = (await scripts.allTextContents()).join("");
    expect(raw).not.toMatch(/"(price|lowPrice|highPrice|minPrice|priceCurrency|priceRange)"/);
    expect(raw).not.toContain("€");
  });
}

test("the services hub publishes a ProfessionalService with four priceless offers", async ({
  page,
}) => {
  await page.goto("/es/servicios");
  const nodes = await readNodes(page);
  const service = nodes.find((node) => node["@type"] === "ProfessionalService");
  const catalog = service?.hasOfferCatalog as { itemListElement: { "@type": string }[] };
  expect(catalog.itemListElement).toHaveLength(4);
  expect(catalog.itemListElement.every((offer) => offer["@type"] === "Offer")).toBe(true);
  expect(service?.provider).toMatchObject({ "@id": expect.stringMatching(/\/#person$/) });
});

test("the contact page publishes a ContactPage", async ({ page }) => {
  await page.goto("/es/contacto");
  const nodes = await readNodes(page);
  expect(nodes.filter((node) => node["@type"] === "ContactPage")).toHaveLength(1);
});
