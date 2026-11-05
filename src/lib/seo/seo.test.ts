import { describe, expect, it } from "vitest";

import { productionOrigin, resolveSite } from "@/config/site";
import { rates } from "@/lib/services/rates";
import { jsonLdGraphSchema } from "@/types/seo";

import {
  buildBreadcrumbList,
  buildContactPage,
  buildFaqPage,
  buildGraph,
  buildPerson,
  buildProfessionalService,
  buildProfilePage,
  buildSiteGraph,
  resolveProfileLinks,
  serializeJsonLd,
} from "./jsonld";
import { buildLlmsTxt } from "./llms";
import { applyTitleTemplate, buildPageMetadata, resolveRobots } from "./metadata";
import { aiCrawlers, buildRobots } from "./robots";
import { buildSitemap } from "./sitemap";

const production = resolveSite({ NEXT_PUBLIC_SITE_URL: productionOrigin });
const preview = resolveSite({
  NEXT_PUBLIC_SITE_URL: "https://josecoded-preview.josecoded-api.workers.dev",
});

describe("resolveSite", () => {
  it("is indexable only on the production origin", () => {
    expect(production).toEqual({ origin: productionOrigin, indexable: true });
    expect(preview.indexable).toBe(false);
    expect(resolveSite({}).indexable).toBe(false);
    expect(resolveSite({ NEXT_PUBLIC_SITE_URL: "not a url" }).origin).toBe("http://localhost:3000");
  });

  it("honours the force-noindex flag", () => {
    const forced = resolveSite({
      NEXT_PUBLIC_SITE_URL: productionOrigin,
      NEXT_PUBLIC_FORCE_NOINDEX: "true",
    });
    expect(forced.indexable).toBe(false);
  });
});

describe("buildRobots", () => {
  it("allows every AI crawler and blocks private zones in production", () => {
    const robots = buildRobots(production, ["es"]);
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    const agents = rules.flatMap((rule) =>
      Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent],
    );
    for (const crawler of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]) {
      expect(agents).toContain(crawler);
    }
    expect(agents).toHaveLength(aiCrawlers.length + 1);
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(
        expect.arrayContaining([
          "/admin",
          "/crm",
          "/area",
          "/freelance",
          "/dev",
          "/es/dev",
          "/entrar",
          "/invitacion",
          "/cuenta",
          "/api/",
          "/auth/",
        ]),
      );
    }
    expect(robots.sitemap).toBe(`${productionOrigin}/sitemap.xml`);
  });

  it("disallows everything on previews", () => {
    expect(buildRobots(preview, ["es"])).toEqual({
      rules: [{ userAgent: "*", disallow: "/" }],
    });
  });
});

describe("buildSitemap", () => {
  it("lists the public routes with absolute URLs once there are projects", () => {
    const urls = buildSitemap(production, ["es"], true, true).map((entry) => entry.url);
    expect(urls).toEqual([
      `${productionOrigin}/es`,
      `${productionOrigin}/es/servicios`,
      `${productionOrigin}/es/servicios/freelance`,
      `${productionOrigin}/es/servicios/a-medida`,
      `${productionOrigin}/es/como-trabajo`,
      `${productionOrigin}/es/proyectos`,
      `${productionOrigin}/es/sobre-mi`,
      `${productionOrigin}/es/contacto`,
    ]);
  });

  it("adds the indexable legal pages with the lowest priority", () => {
    const entries = buildSitemap(production, ["es"], true, true, ["/legal/privacidad"]);
    expect(entries.at(-1)).toEqual({
      url: `${productionOrigin}/es/legal/privacidad`,
      priority: 0.2,
    });
  });

  it("leaves /contacto out while no channel is live", () => {
    const urls = buildSitemap(production, ["es"], true, false).map((entry) => entry.url);
    expect(urls).not.toContain(`${productionOrigin}/es/contacto`);
  });

  it("leaves /proyectos out while no project is published", () => {
    const urls = buildSitemap(production, ["es"], false, false).map((entry) => entry.url);
    expect(urls).toEqual([
      `${productionOrigin}/es`,
      `${productionOrigin}/es/servicios`,
      `${productionOrigin}/es/servicios/freelance`,
      `${productionOrigin}/es/servicios/a-medida`,
      `${productionOrigin}/es/como-trabajo`,
      `${productionOrigin}/es/sobre-mi`,
    ]);
  });
});

describe("buildPageMetadata", () => {
  it("builds canonical, title and social tags", async () => {
    const metadata = await buildPageMetadata({
      locale: "es",
      path: "/servicios",
      title: "services.meta.title",
      description: "services.meta.description",
    });
    expect(metadata.alternates?.canonical).toBe("/es/servicios");
    expect(metadata.title).toBe("Servicios de desarrollo de apps y webs");
    expect(metadata.openGraph?.title).toBe("Servicios de desarrollo de apps y webs · josecoded");
  });

  it("marks a page noindex when it is not indexable", async () => {
    const metadata = await buildPageMetadata({
      locale: "es",
      path: "/proyectos",
      title: "projects.metaTitle",
      description: "projects.metaDescription",
      indexable: false,
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/es/proyectos");
  });

  it("resolves the layout robots from the site", () => {
    expect(resolveRobots(production)).toBeUndefined();
    expect(resolveRobots(preview)).toEqual({ index: false, follow: false });
  });

  it("applies the title template", () => {
    expect(applyTitleTemplate("%s · josecoded", "Proyectos")).toBe("Proyectos · josecoded");
  });
});

describe("json-ld", () => {
  it("builds a valid Person with the full name, email and LinkedIn", async () => {
    const person = await buildPerson(productionOrigin, "es");
    expect(person["@id"]).toBe(`${productionOrigin}/#person`);
    expect(person.name).toBe("José Carlos Sánchez García");
    expect(person.givenName).toBe("José Carlos");
    expect(person.familyName).toBe("Sánchez García");
    expect(person.alternateName).toEqual(["josecoded"]);
    expect(person.email).toBe("hola@josecoded.com");
    expect(person.address.addressLocality).toBe("Madrid");
    expect(person.areaServed.map((area) => area.name)).toEqual(["España", "Remoto"]);
    expect(person.sameAs).toEqual([
      "https://www.linkedin.com/in/jos%C3%A9-carlos-s%C3%A1nchez-garc%C3%ADa-7019072a9/",
    ]);
  });

  it("adds the topics, languages, employer, school and credentials from the CV", async () => {
    const person = await buildPerson(productionOrigin, "es");
    expect(person.knowsAbout).toContain("React Native");
    expect(person.knowsLanguage).toEqual(["es", "en"]);
    expect(person.worksFor).toEqual({ "@type": "Organization", name: "Alten" });
    expect(person.alumniOf?.map((school) => school.name)).toEqual(["I.E.S. El Lago, Madrid"]);
    expect(person.hasCredential?.map((credential) => credential.name)).toContain(
      "Cambridge B2 First",
    );
    expect(JSON.stringify(person)).not.toContain("{{DATO");
  });

  it("keeps real profile links and drops placeholders", async () => {
    const links = { linkedin: "https://www.linkedin.com/in/example", github: "{{DATO}}" };
    expect(resolveProfileLinks(links)).toEqual(["https://www.linkedin.com/in/example"]);
    const person = await buildPerson(productionOrigin, "es", links, []);
    expect(person.email).toBeUndefined();
    expect(person.sameAs).toEqual(["https://www.linkedin.com/in/example"]);
  });

  it("builds the site graph and validates it", async () => {
    const graph = await buildSiteGraph(productionOrigin, "es");
    expect(jsonLdGraphSchema.safeParse(graph).success).toBe(true);
    expect(graph["@graph"].map((node) => node["@type"])).toEqual(["Person", "WebSite"]);
  });

  it("escapes markup characters when serialising", async () => {
    const person = await buildPerson(productionOrigin, "es");
    const serialized = serializeJsonLd(buildGraph({ ...person, name: "</script><b>&" }));
    expect(serialized).not.toMatch(/[<>&]/);
    expect(jsonLdGraphSchema.parse(JSON.parse(serialized))["@graph"][0]).toMatchObject({
      name: "</script><b>&",
    });
  });

  it("builds a BreadcrumbList with absolute URLs and positions", () => {
    const list = buildBreadcrumbList(productionOrigin, [
      { name: "Inicio", path: "/es" },
      { name: "Servicios", path: "/es/servicios" },
    ]);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${productionOrigin}/es` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Servicios",
        item: `${productionOrigin}/es/servicios`,
      },
    ]);
    expect(jsonLdGraphSchema.safeParse(buildGraph(list)).success).toBe(true);
  });

  it("builds a ProfessionalService with an offer catalog and no price", async () => {
    const service = await buildProfessionalService(
      productionOrigin,
      "es",
      "/servicios",
      [
        { name: "Contratación", description: "Me incorporo a tu equipo." },
        { name: "Freelance", description: "Una funcionalidad puntual." },
        { name: "Desarrollo a medida", description: "Una web o app completa." },
      ],
      { catalogName: "Servicios" },
    );
    expect(service).toMatchObject({
      "@type": "ProfessionalService",
      url: `${productionOrigin}/es/servicios`,
      provider: { "@id": `${productionOrigin}/#person` },
      hasOfferCatalog: { "@type": "OfferCatalog", name: "Servicios" },
    });
    expect(service.hasOfferCatalog.itemListElement.map((offer) => offer.name)).toEqual([
      "Contratación",
      "Freelance",
      "Desarrollo a medida",
    ]);
    const serialized = serializeJsonLd(buildGraph(service));
    expect(serialized).not.toMatch(/price|Price|priceCurrency|EUR|€/);
    expect(jsonLdGraphSchema.safeParse(buildGraph(service)).success).toBe(true);
  });

  it("rejects a price on an offer", () => {
    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfessionalService",
          "@id": `${productionOrigin}/es/servicios#service`,
          name: "josecoded",
          description: "Servicios",
          url: `${productionOrigin}/es/servicios`,
          inLanguage: "es",
          provider: { "@id": `${productionOrigin}/#person` },
          areaServed: [],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Servicios",
            itemListElement: [
              {
                "@type": "Offer",
                name: "Freelance",
                description: "Por horas",
                price: "50",
                itemOffered: { "@type": "Service", name: "Freelance" },
              },
            ],
          },
        },
      ],
    };
    expect(jsonLdGraphSchema.safeParse(graph).success).toBe(false);
  });

  it("builds a ContactPage that points to the site and the person", () => {
    const page = buildContactPage(productionOrigin, "es", "/contacto", {
      name: "Contacto",
      description: "Formas de hablar",
    });
    expect(page).toMatchObject({
      "@type": "ContactPage",
      url: `${productionOrigin}/es/contacto`,
      isPartOf: { "@id": `${productionOrigin}/#website` },
      about: { "@id": `${productionOrigin}/#person` },
    });
    expect(jsonLdGraphSchema.safeParse(buildGraph(page)).success).toBe(true);
  });

  it("builds a ProfilePage whose main entity is the site person", () => {
    const page = buildProfilePage(
      productionOrigin,
      "es",
      "/sobre-mi",
      { name: "Sobre mí", description: "Perfil" },
      "2026-11-05",
    );
    expect(page).toMatchObject({
      "@type": "ProfilePage",
      url: `${productionOrigin}/es/sobre-mi`,
      inLanguage: "es",
      dateModified: "2026-11-05",
      isPartOf: { "@id": `${productionOrigin}/#website` },
      mainEntity: { "@id": `${productionOrigin}/#person` },
    });
    expect(jsonLdGraphSchema.safeParse(buildGraph(page)).success).toBe(true);
  });

  it("builds a FAQPage from the visible questions", () => {
    const page = buildFaqPage([{ id: "a", question: "¿Q?", answer: "A." }]);
    expect(page.mainEntity).toEqual([
      { "@type": "Question", name: "¿Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
    ]);
    expect(() => buildFaqPage([])).toThrow();
  });

  it("rejects invalid data", async () => {
    const person = await buildPerson(productionOrigin, "es");
    expect(() => buildGraph({ ...person, url: "not a url" })).toThrow();
  });
});

describe("buildLlmsTxt rates", () => {
  it("prints the rates only when they are final", async () => {
    const final = await buildLlmsTxt(productionOrigin, "es", {
      status: "final",
      hour: "60",
      task: "300",
    });
    expect(final).toContain("Tarifa por hora: 60 €.");
    expect(final).toContain("Presupuesto por tarea desde 300 €.");
  });

  it("omits provisional prices entirely", async () => {
    const text = await buildLlmsTxt(productionOrigin, "es", rates);
    expect(text).not.toContain("Tarifa por hora");
    expect(text).not.toContain("Presupuesto por tarea");
    expect(text).not.toMatch(/\b0{2,3}\b/);
  });
});

describe("buildLlmsTxt", () => {
  it("describes the same entity as the Person and lists the emails", async () => {
    const text = await buildLlmsTxt(productionOrigin, "es", rates);
    expect(text.startsWith("# josecoded\n")).toBe(true);
    expect(text).toContain("Madrid");
    expect(text).toContain("Desarrollador full stack especializado en React Native");
    expect(text).not.toContain("{{DATO");
    expect(text).not.toContain("chat");
    expect(text).toContain(`(${productionOrigin}/es/servicios)`);
    expect(text).toContain(`(${productionOrigin}/es/servicios/freelance)`);
    expect(text).toContain(`(${productionOrigin}/es/servicios/a-medida)`);
    expect(text).toContain(`(${productionOrigin}/es/como-trabajo)`);
    expect(text).toContain(`(${productionOrigin}/es/contacto)`);
    expect(text).toContain(`(${productionOrigin}/es/sobre-mi)`);
    expect(text).toContain("José Carlos Sánchez García");
    expect(text).toContain("Contratación: hola@josecoded.com");
    expect(text).toContain("Freelance: freelance@josecoded.com");
    expect(text).toContain("Desarrollo a medida: proyectos@josecoded.com");
  });
});
