import { describe, expect, it } from "vitest";

import { productionOrigin, resolveSite } from "@/config/site";
import { projectSchema } from "@/content/schemas";
import { rates } from "@/lib/services/rates";
import { jsonLdGraphSchema } from "@/types/seo";

import { buildBreadcrumbList, buildGraph, buildProject, personId } from "./jsonld";
import { buildLlmsTxt } from "./llms";
import { buildSitemap } from "./sitemap";

const base = {
  title: "Demo",
  slug: "demo",
  kind: "app",
  status: "live",
  headline: "Una línea",
  description: "Descripción",
  role: "Rol",
  period: "2026",
  sector: "Sector",
  stack: ["React Native"],
  relatedService: "freelance",
  order: 1,
};

describe("buildProject", () => {
  it("describes an app as MobileApplication with the person as contributor on team work", () => {
    const node = buildProject(productionOrigin, "es", projectSchema.parse({ ...base, team: true }));
    expect(node["@type"]).toBe("MobileApplication");
    expect(node.operatingSystem).toBe("iOS, Android");
    expect(node.contributor).toEqual({ "@id": personId(productionOrigin) });
    expect(node.creator).toBeUndefined();
    expect(node.url).toBe(`${productionOrigin}/es/proyectos/demo`);
    expect(JSON.stringify(node)).not.toContain("aggregateRating");
  });

  it("uses CreativeWork with the person as creator on solo work, WebSite with a public URL", () => {
    const solo = buildProject(
      productionOrigin,
      "es",
      projectSchema.parse({ ...base, kind: "web" }),
    );
    expect(solo["@type"]).toBe("CreativeWork");
    expect(solo.creator).toEqual({ "@id": personId(productionOrigin) });
    const site = buildProject(
      productionOrigin,
      "es",
      projectSchema.parse({ ...base, kind: "web", links: { web: "https://example.com" } }),
    );
    expect(site["@type"]).toBe("WebSite");
    expect(site.url).toBe("https://example.com");
  });

  it("fits in a graph with the breadcrumb", () => {
    const graph = buildGraph(
      buildBreadcrumbList(productionOrigin, [{ name: "Inicio", path: "/es" }]),
      buildProject(productionOrigin, "es", projectSchema.parse(base)),
    );
    expect(jsonLdGraphSchema.safeParse(graph).success).toBe(true);
  });
});

describe("projects in sitemap and llms.txt", () => {
  const site = resolveSite({ NEXT_PUBLIC_SITE_URL: productionOrigin });

  it("lists every project page after the list", () => {
    const urls = buildSitemap(site, ["es"], true, true, [], ["a", "b"]).map((entry) => entry.url);
    expect(urls).toContain(`${productionOrigin}/es/proyectos/a`);
    expect(urls).toContain(`${productionOrigin}/es/proyectos/b`);
  });

  it("leaves project pages out while there are no projects", () => {
    const urls = buildSitemap(site, ["es"], false, true, [], ["a"]).map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/proyectos"))).toBe(false);
  });

  it("names each project in llms.txt", async () => {
    const text = await buildLlmsTxt(productionOrigin, "es", rates, undefined, true, [
      { slug: "a", title: "A", headline: "Línea" },
    ]);
    expect(text).toContain(`(${productionOrigin}/es/proyectos/a)`);
    expect(text).toContain("[A: Línea]");
  });
});
