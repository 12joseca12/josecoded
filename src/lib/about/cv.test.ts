import { describe, expect, it } from "vitest";

import { getCv } from "@/content";
import { cvSchema } from "@/content/schemas";

import {
  resolveAvailability,
  resolveCvHref,
  resolveEducation,
  resolveExperience,
  resolvePersonFacts,
  resolveProfileLinks,
  resolveStack,
  yearsLabel,
} from "./cv";

const pendingText = "{{DATO: dato}}";

describe("resolveStack", () => {
  const stack = cvSchema.shape.stack.parse([
    {
      group: "mobile",
      items: [
        { name: "React Native", years: 5, level: "advanced" },
        { name: "Expo", years: pendingText, level: pendingText },
        { name: "iOS" },
      ],
    },
  ]);

  it("keeps resolved years and level and nulls the pending ones", () => {
    expect(resolveStack(stack)).toEqual([
      {
        group: "mobile",
        items: [
          { name: "React Native", years: 5, level: "advanced" },
          { name: "Expo", years: null, level: null },
          { name: "iOS", years: null, level: null },
        ],
      },
    ]);
  });
});

describe("resolveExperience and resolveEducation", () => {
  it("hides an entry while any of its fields is pending", () => {
    const experience = cvSchema.shape.experience.parse([
      {
        period: "2024",
        role: "Dev",
        organization: "Acme",
        summary: "Hice cosas",
        highlights: ["Uno"],
      },
      { period: pendingText, role: "Dev", organization: "Acme", summary: "Hice cosas" },
    ]);
    expect(resolveExperience(experience)).toEqual([
      {
        period: "2024",
        title: "Dev",
        organization: "Acme",
        summary: "Hice cosas",
        highlights: ["Uno"],
      },
    ]);
  });

  it("maps education without a summary", () => {
    const education = cvSchema.shape.education.parse([
      { period: "2020", title: "Grado", organization: "Universidad" },
      { period: pendingText, title: pendingText, organization: pendingText },
      { title: "Scrum Master" },
    ]);
    expect(resolveEducation(education)).toEqual([
      {
        period: "2020",
        title: "Grado",
        organization: "Universidad",
        summary: null,
        highlights: [],
      },
      { period: null, title: "Scrum Master", organization: null, summary: null, highlights: [] },
    ]);
  });
});

describe("resolveCvHref", () => {
  const file = { es: "/cv/es.pdf", en: "{{DATO: CV}}" };

  it("picks the file of the locale", () => {
    expect(resolveCvHref(file, "es")).toBe("/cv/es.pdf");
  });

  it("hides the download while the file of that locale is pending", () => {
    expect(resolveCvHref(file, "en")).toBeNull();
  });

  it("hides the download when the feature flag is off", () => {
    expect(resolveCvHref(file, "es", false)).toBeNull();
  });
});

describe("resolveProfileLinks", () => {
  it("drops placeholders and keeps the LinkedIn first", () => {
    expect(
      resolveProfileLinks({
        github: "https://github.com/example",
        linkedin: "https://www.linkedin.com/in/example",
        malt: "{{DATO}}",
      }),
    ).toEqual([
      { id: "linkedin", href: "https://www.linkedin.com/in/example" },
      { id: "github", href: "https://github.com/example" },
    ]);
  });
});

describe("yearsLabel", () => {
  it("uses the singular for one year", () => {
    expect(yearsLabel(1, "{n} año", "{n} años")).toBe("1 año");
    expect(yearsLabel(5, "{n} año", "{n} años")).toBe("5 años");
  });
});

describe("content/cv.json", () => {
  it("parses and covers the six areas of the stack", () => {
    expect(getCv().stack.map((entry) => entry.group)).toEqual([
      "mobile",
      "web",
      "backend",
      "ai",
      "quality",
      "tools",
    ]);
  });
});

describe("resolveAvailability", () => {
  const labels = { remote: "Remoto", hybrid: "Híbrido", remoteOrHybrid: "Remoto o híbrido" };

  it("returns null without data so the line stays hidden", () => {
    expect(resolveAvailability({ modality: null, notice: null }, labels)).toBeNull();
  });

  it("ignores a pending notice", () => {
    expect(
      resolveAvailability({ modality: null, notice: "{{DATO: preaviso}}" }, labels),
    ).toBeNull();
  });

  it("joins the modality and the notice", () => {
    expect(
      resolveAvailability({ modality: "remoteOrHybrid", notice: "Preaviso de un mes" }, labels),
    ).toBe("Remoto o híbrido · Preaviso de un mes");
  });
});

describe("resolvePersonFacts", () => {
  const facts = resolvePersonFacts(getCv());

  it("lists the main stack topics once", () => {
    expect(facts.knowsAbout).toContain("React Native");
    expect(facts.knowsAbout).not.toContain("Jira");
    expect(new Set(facts.knowsAbout).size).toBe(facts.knowsAbout.length);
  });

  it("takes the employer from the current role", () => {
    expect(facts.worksFor).toBe("Alten");
  });

  it("separates the degree from the certifications", () => {
    expect(facts.alumniOf).toEqual(["I.E.S. El Lago, Madrid"]);
    expect(facts.credentials.map((credential) => credential.name)).toContain("Cambridge B2 First");
    expect(facts.credentials.every((credential) => !credential.name.includes("DAW"))).toBe(true);
  });
});
