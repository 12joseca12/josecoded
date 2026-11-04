import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";

import { extraOf, offerOf, offerSlugs } from "./offers";
import {
  extraRules,
  inferKind,
  moreValues,
  optionsFor,
  type ProjectAnswers,
  type ProjectRecommendation,
  type Reason,
  recommend,
  selectedExtras,
} from "./recommender";
import { questions } from "./recommender";
import {
  optionHintKey,
  optionLabelKey,
  questionLegendKey,
  reasonMessageKey,
} from "./recommender-copy";

const base: ProjectAnswers = {
  start: "idea",
  kind: "web",
  size: "medium",
  accounts: "none",
  management: "rare",
  more: [],
};

function project(overrides: Partial<ProjectAnswers>): ProjectRecommendation {
  const result = recommend({ ...base, ...overrides });
  if (result.route !== "project") throw new Error("expected a project route");
  return result;
}

const ids = (reasons: Reason[]) => reasons.map((reason) => reason.id);

describe("recommend: routes", () => {
  it("R1: an existing product goes to freelance and never gets a tier", () => {
    expect(recommend({ start: "existing" })).toEqual({
      route: "freelance",
      reasons: [{ id: "existing" }],
    });
  });
});

describe("recommend: platform and tier", () => {
  it.each([
    ["web", "small", ["web-presencia"]],
    ["web", "medium", ["web-negocio"]],
    ["web", "large", ["web-plataforma"]],
    ["app", "small", ["app-primera-version"]],
    ["app", "medium", ["app-primera-version"]],
    ["app", "large", ["app-producto"]],
    ["both", "small", ["web-presencia", "app-primera-version"]],
    ["both", "medium", ["web-negocio", "app-primera-version"]],
    ["both", "large", ["web-plataforma", "app-producto"]],
  ] as const)("R3: kind %s with size %s gives %j", (kind, size, expected) => {
    expect(project({ kind, size }).offers).toEqual(expected);
  });

  it("R3: states the platform in the reasons", () => {
    expect(ids(project({ kind: "web" }).reasons)).toContain("platform_web");
    expect(ids(project({ kind: "app" }).reasons)).toContain("platform_app");
    expect(ids(project({ kind: "both" }).reasons)).toContain("platform_both");
  });

  it("R2: an unsure size assumes the medium scope and says so", () => {
    const result = project({ size: "unsure" });
    expect(result.offers).toEqual(["web-negocio"]);
    expect(result.assumed).toEqual({ kind: false, size: true });
    expect(ids(result.reasons)).toContain("assumed_size");
  });

  it("R2: an unsure kind infers the platform from the extras and says so", () => {
    const result = project({ kind: "unsure", more: ["push"] });
    expect(result.offers).toEqual(["app-primera-version"]);
    expect(result.assumed.kind).toBe(true);
    expect(ids(result.reasons)).toContain("assumed_kind");
    expect(project({ kind: "unsure" }).offers).toEqual(["web-negocio"]);
    expect(project({ kind: "unsure", more: ["seo", "offline"] }).offers).toEqual([
      "web-negocio",
      "app-primera-version",
    ]);
  });

  it("infers the kind from mobile and search extras", () => {
    expect(inferKind([])).toBe("web");
    expect(inferKind(["seo"])).toBe("web");
    expect(inferKind(["stores"])).toBe("app");
    expect(inferKind(["seo", "push"])).toBe("both");
  });

  it("R4: different user types lift every platform to its top tier", () => {
    const result = project({ kind: "both", size: "small", accounts: "roles" });
    expect(result.offers).toEqual(["web-plataforma", "app-producto"]);
    expect(ids(result.reasons)).toContain("bump_roles");
  });

  it("R4: several people with permissions lift the tier too", () => {
    const result = project({ size: "small", management: "team" });
    expect(result.offers).toEqual(["web-plataforma"]);
    expect(ids(result.reasons)).toContain("bump_team");
  });

  it("R4: no bump reason when the size already gave the top tier", () => {
    const result = project({ size: "large", accounts: "roles" });
    expect(ids(result.reasons)).not.toContain("bump_roles");
  });
});

describe("recommend: extras", () => {
  it("R5: basic accounts add the extra where they are not included", () => {
    const result = project({ size: "small", accounts: "basic" });
    expect(result.extras).toContain("accounts");
    expect(result.included).not.toContain("accounts");
  });

  it("R5: basic accounts are included, not added, in an app", () => {
    const result = project({ kind: "app", accounts: "basic" });
    expect(result.extras).not.toContain("accounts");
    expect(result.included).toEqual(["accounts"]);
    expect(ids(result.reasons)).toContain("included");
  });

  it("R5: web and app together still add the accounts the web tier lacks", () => {
    expect(project({ kind: "both", size: "medium", accounts: "basic" }).extras).toContain(
      "accounts",
    );
  });

  it("R7a: wanting a panel adds admin only where it is not included", () => {
    expect(project({ size: "small", management: "me" }).extras).toContain("admin");
    const negocio = project({ size: "medium", management: "me" });
    expect(negocio.extras).not.toContain("admin");
    expect(negocio.included).toEqual(["admin"]);
    expect(project({ kind: "app", management: "me" }).extras).toContain("admin");
  });

  it("R7b: team management needs no extra, the top tier brings the panel", () => {
    const result = project({ management: "team" });
    expect(result.extras).not.toContain("admin");
    expect(result.offers).toEqual(["web-plataforma"]);
  });

  it("R7c: rare changes add nothing but a note", () => {
    const result = project({ management: "rare" });
    expect(result.extras).toEqual([]);
    expect(ids(result.reasons)).toContain("management_rare");
  });

  it.each(moreValues)("R8: %s is added when it applies and is not included", (value) => {
    const result = project({ kind: "both", size: "small", more: [value] });
    const addable = result.available.includes(value);
    expect(result.extras.includes(value)).toBe(addable);
    if (addable) expect(ids(result.reasons)).toContain(`extra:${value}`);
  });

  it("R8: ignores extras that cannot apply to the chosen platform", () => {
    expect(project({ kind: "web", more: ["push", "offline", "stores"] }).extras).toEqual([]);
    expect(project({ kind: "app", more: ["seo"] }).extras).toEqual([]);
  });

  it("R8: reports an extra that the tier already includes", () => {
    const result = project({ kind: "app", size: "large", more: ["push", "analytics"] });
    expect(result.extras).toEqual([]);
    expect(result.included).toEqual(["analytics", "push"]);
  });

  it("R9: maintenance is always on offer and selected by default only for web and app", () => {
    expect(project({ kind: "web" }).available).toContain("maintenance");
    expect(project({ kind: "web" }).extras).not.toContain("maintenance");
    expect(project({ kind: "both" }).extras).toContain("maintenance");
    expect(ids(project({ kind: "both" }).reasons)).toContain("maintenance_both");
  });
});

const allAnswers: ProjectAnswers[] = [];
for (const start of ["idea", "defined"] as const) {
  for (const kind of ["web", "app", "both", "unsure"] as const) {
    for (const size of ["small", "medium", "large", "unsure"] as const) {
      for (const accounts of ["none", "basic", "roles"] as const) {
        for (const management of ["me", "rare", "team"] as const) {
          for (const more of [[], [...moreValues], ["push", "ai"], ["seo", "languages"]] as const) {
            allAnswers.push({ start, kind, size, accounts, management, more });
          }
        }
      }
    }
  }
}
const allResults = allAnswers.map((answers) => ({ answers, result: recommend(answers) }));

describe("recommend: invariants", () => {
  it("never returns more than one tier per platform", () => {
    for (const { result } of allResults) {
      if (result.route !== "project") continue;
      const platforms = result.offers.map((slug) => offerOf(slug).platform);
      expect(new Set(platforms).size).toBe(platforms.length);
      expect(result.offers.length).toBeGreaterThan(0);
    }
  });

  it("never offers an extra that applies to none of the chosen tiers", () => {
    for (const { result } of allResults) {
      if (result.route !== "project") continue;
      for (const slug of [...result.extras, ...result.available, ...result.included]) {
        const extra = extraOf(slug);
        expect(result.offers.some((offer) => extra.applies.includes(offer))).toBe(true);
      }
    }
  });

  it("keeps extras unique, inside available and apart from included", () => {
    for (const { result } of allResults) {
      if (result.route !== "project") continue;
      expect(new Set(result.extras).size).toBe(result.extras.length);
      for (const extra of result.extras) expect(result.available).toContain(extra);
      for (const extra of result.included) expect(result.extras).not.toContain(extra);
    }
  });

  it("is a pure function of the answers", () => {
    for (const { answers, result } of allResults) {
      expect(recommend(structuredClone(answers))).toEqual(result);
    }
  });

  it("has a unique id for every extra rule", () => {
    expect(new Set(extraRules.map((rule) => rule.id)).size).toBe(extraRules.length);
  });
});

describe("selectedExtras", () => {
  it("keeps the recommendation without a request and filters an edited one", () => {
    const result = project({ kind: "app", size: "small", more: ["push"] });
    expect(selectedExtras(result)).toEqual(["push"]);
    expect(selectedExtras(result, ["offline", "seo", "push", "offline"])).toEqual([
      "push",
      "offline",
    ]);
    expect(selectedExtras(result, [])).toEqual([]);
  });
});

describe("optionsFor", () => {
  it("hides extras that cannot apply to the chosen kind", () => {
    expect(optionsFor("more", { kind: "web" })).not.toContain("push");
    expect(optionsFor("more", { kind: "web" })).toContain("seo");
    expect(optionsFor("more", { kind: "app" })).not.toContain("seo");
    expect(optionsFor("more", { kind: "both" })).toEqual([...moreValues]);
    expect(optionsFor("more", { kind: "unsure" })).toEqual([...moreValues]);
    expect(optionsFor("more", {})).toEqual([...moreValues]);
  });
});

describe.each(["es", "en"] as const)("copy in %s", (locale) => {
  it("has a text for every reason the table can give", async () => {
    const t = await getTranslator(locale);
    const seen = new Set<Reason["id"]>(["existing"]);
    for (const { result } of allResults) {
      for (const reason of result.reasons) seen.add(reason.id);
    }
    for (const id of seen) expect(t(reasonMessageKey(id)).length).toBeGreaterThan(0);
    for (const slug of offerSlugs) expect(seen.has(`tier:${slug}`)).toBe(true);
  });

  it("has a legend, a label and a hint for every question and option", async () => {
    const t = await getTranslator(locale);
    for (const question of questions) {
      expect(t(questionLegendKey(question.id)).length).toBeGreaterThan(0);
      for (const value of question.options) {
        expect(t(optionLabelKey(question.id, value)).length).toBeGreaterThan(0);
        expect(t(optionHintKey(question.id, value)).length).toBeGreaterThan(0);
      }
    }
  });
});
