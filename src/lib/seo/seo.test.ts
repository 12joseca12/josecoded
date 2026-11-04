import { describe, expect, it } from "vitest";

import { buildHeaders } from "@/config/headers";
import { productionOrigin, resolveSite } from "@/config/site";
import { rates } from "@/lib/services/rates";
import { jsonLdGraphSchema } from "@/types/seo";

import {
  buildGraph,
  buildPerson,
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
      `${productionOrigin}/es/proyectos`,
      `${productionOrigin}/es/contacto`,
    ]);
  });

  it("leaves /contacto out while no channel is live", () => {
    const urls = buildSitemap(production, ["es"], true, false).map((entry) => entry.url);
    expect(urls).not.toContain(`${productionOrigin}/es/contacto`);
  });

  it("leaves /proyectos out while no project is published", () => {
    const urls = buildSitemap(production, ["es"], false, false).map((entry) => entry.url);
    expect(urls).toEqual([`${productionOrigin}/es`, `${productionOrigin}/es/servicios`]);
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
    expect(person.alternateName).toEqual(["José Carlos Sánchez", "josecoded"]);
    expect(person.email).toBe("hola@josecoded.com");
    expect(person.address.addressLocality).toBe("Madrid");
    expect(person.areaServed.map((area) => area.name)).toEqual(["España", "Remoto"]);
    expect(person.sameAs).toEqual([
      "https://www.linkedin.com/in/jos%C3%A9-carlos-s%C3%A1nchez-garc%C3%ADa-7019072a9/",
    ]);
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

describe("buildHeaders", () => {
  it("noindexes dev pages and workers.dev hosts even in production", () => {
    const rules = buildHeaders(production);
    expect(rules).toHaveLength(2);
    expect(rules[0]?.source).toBe("/:locale/dev/:path*");
    const host = rules[1]?.has?.[0];
    expect(host?.type).toBe("host");
    const pattern = new RegExp(`^${host?.value ?? ""}$`);
    expect(pattern.test("josecoded-preview.josecoded-api.workers.dev")).toBe(true);
    expect(pattern.test("josecoded.com")).toBe(false);
  });

  it("noindexes everything on non-production builds", () => {
    const rules = buildHeaders(preview);
    expect(rules).toHaveLength(3);
    expect(rules[2]).toEqual({
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    });
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
    expect(text).toContain(`(${productionOrigin}/es/contacto)`);
    expect(text).toContain("José Carlos Sánchez García");
    expect(text).toContain("Contratación: hola@josecoded.com");
    expect(text).toContain("Freelance: freelance@josecoded.com");
    expect(text).toContain("Proyectos y packs: proyectos@josecoded.com");
  });
});
