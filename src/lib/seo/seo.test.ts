import { describe, expect, it } from "vitest";

import { productionOrigin, resolveSite } from "@/config/site";
import { jsonLdGraphSchema } from "@/types/seo";

import {
  buildBreadcrumbList,
  buildGraph,
  buildPerson,
  buildSiteGraph,
  resolveProfileLinks,
  serializeJsonLd,
} from "./jsonld";
import { buildLlmsTxt } from "./llms";
import { applyTitleTemplate, buildPageMetadata } from "./metadata";
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
        expect.arrayContaining(["/admin", "/crm", "/area", "/freelance", "/dev", "/es/dev"]),
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
  it("lists the public routes with absolute URLs", () => {
    const urls = buildSitemap(production, ["es"]).map((entry) => entry.url);
    expect(urls).toEqual([
      `${productionOrigin}/es`,
      `${productionOrigin}/es/servicios`,
      `${productionOrigin}/es/proyectos`,
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

  it("applies the title template", () => {
    expect(applyTitleTemplate("%s · josecoded", "Proyectos")).toBe("Proyectos · josecoded");
  });
});

describe("json-ld", () => {
  it("builds a valid Person with Madrid and no pending profiles", async () => {
    const person = await buildPerson(productionOrigin, "es");
    expect(person["@id"]).toBe(`${productionOrigin}/#person`);
    expect(person.name).toBe("Jose");
    expect(person.alternateName).toBe("josecoded");
    expect(person.address.addressLocality).toBe("Madrid");
    expect(person.areaServed.map((area) => area.name)).toEqual(["España", "Remoto"]);
    expect(person.sameAs).toBeUndefined();
  });

  it("keeps real profile links and drops placeholders", async () => {
    const links = { linkedin: "https://www.linkedin.com/in/example", github: "{{DATO}}" };
    expect(resolveProfileLinks(links)).toEqual(["https://www.linkedin.com/in/example"]);
    const person = await buildPerson(productionOrigin, "es", links);
    expect(person.sameAs).toEqual(["https://www.linkedin.com/in/example"]);
  });

  it("builds the site graph and validates it", async () => {
    const graph = await buildSiteGraph(productionOrigin, "es");
    expect(jsonLdGraphSchema.safeParse(graph).success).toBe(true);
    expect(graph["@graph"].map((node) => node["@type"])).toEqual(["Person", "WebSite"]);
  });

  it("builds a breadcrumb list", () => {
    const list = buildBreadcrumbList(productionOrigin, [
      { name: "Inicio", path: "/es" },
      { name: "Servicios", path: "/es/servicios" },
    ]);
    expect(list.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(list.itemListElement[1]?.item).toBe(`${productionOrigin}/es/servicios`);
    expect(buildGraph(list)["@graph"]).toHaveLength(1);
  });

  it("rejects invalid data", () => {
    expect(() => buildBreadcrumbList("not a url", [{ name: "x", path: "/y" }])).toThrow();
  });

  it("escapes markup characters when serialising", () => {
    const list = buildBreadcrumbList(productionOrigin, [{ name: "</script><b>&", path: "/x" }]);
    const serialized = serializeJsonLd(buildGraph(list));
    expect(serialized).not.toMatch(/[<>&]/);
    expect(jsonLdGraphSchema.parse(JSON.parse(serialized))).toEqual(buildGraph(list));
  });
});

describe("buildLlmsTxt", () => {
  it("describes the same entity as the Person and keeps pending numbers", async () => {
    const text = await buildLlmsTxt(productionOrigin, "es", { hour: "{{DATO}}", task: "{{DATO}}" });
    expect(text.startsWith("# josecoded\n")).toBe(true);
    expect(text).toContain("Madrid");
    expect(text).toContain("Desarrollador full stack especializado en React Native");
    expect(text).toContain("Tarifa por hora: {{DATO}} €");
    expect(text).toContain(`(${productionOrigin}/es/servicios)`);
  });
});
