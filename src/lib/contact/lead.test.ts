import { describe, expect, it } from "vitest";

import type { ContactSubmission, OfferAnswers } from "@/types/contact-form";

import { buildLeadArgs, mapLeadError } from "./lead";
import { resolveInitialWay, viaByWay } from "./ways";

describe("mapLeadError", () => {
  it("maps every quota error and the alternatives hint to quota", () => {
    for (const message of [
      "form_quota_exceeded",
      "form_email_quota_exceeded",
      "form_global_quota_exceeded",
    ]) {
      expect(mapLeadError({ code: "P0001", message })).toBe("quota");
    }
    expect(mapLeadError({ code: "P0001", message: "x", hint: "contact_alternatives" })).toBe(
      "quota",
    );
  });

  it("maps consent and everything else", () => {
    expect(mapLeadError({ code: "P0001", message: "consent_required" })).toBe("consent");
    expect(mapLeadError({ code: "P0001", message: "ip_hash_required" })).toBe("error");
    expect(mapLeadError({ code: "23514", message: "check violation" })).toBe("error");
    expect(mapLeadError({})).toBe("error");
  });
});

const submission: ContactSubmission = {
  way: "project",
  name: "Ada",
  email: "ada@example.com",
  company: "  ",
  message: "Hola",
  consent: true,
  offer: ["web-negocio"],
  extras: ["seo", "payments"],
  locale: "es",
  turnstileToken: "t",
};

describe("buildLeadArgs", () => {
  it("maps way to via and carries consent and hash", () => {
    const args = buildLeadArgs(submission, "h".repeat(64));
    expect(args).toMatchObject({
      p_source: "form",
      p_via: "project",
      p_full_name: "Ada",
      p_email: "ada@example.com",
      p_message: "Hola",
      p_locale: "es",
      p_consent: true,
      p_ip_hash: "h".repeat(64),
      p_page_path: "/es/contacto",
      p_offer: "web-negocio",
      p_extras: ["payments", "seo"],
    });
    expect(args.p_organization).toBeUndefined();
    expect(args.p_offer_answers).toBeUndefined();
  });

  it("joins both platform offers and passes the answers through", () => {
    const answers: OfferAnswers = {
      start: "idea",
      kind: "both",
      size: "medium",
      accounts: "basic",
      management: "me",
      more: ["seo"],
    };
    const args = buildLeadArgs(
      { ...submission, offer: ["web-negocio", "app-primera-version"], extras: [], answers },
      "h",
    );
    expect(args.p_offer).toBe("web-negocio,app-primera-version");
    expect(args.p_extras).toBeUndefined();
    expect(args.p_offer_answers).toEqual(answers);
  });

  it("sends no offer fields when the visitor picked none", () => {
    const args = buildLeadArgs({ ...submission, offer: undefined, extras: undefined }, "h");
    expect(args.p_offer).toBeUndefined();
    expect(args.p_extras).toBeUndefined();
  });

  it("ignores unknown offer and extra slugs", () => {
    const args = buildLeadArgs({ ...submission, offer: ["nope"], extras: ["nope"] }, "h");
    expect(args.p_offer).toBeUndefined();
    expect(args.p_extras).toBeUndefined();
  });

  it("keeps the answers only for project and freelance", () => {
    const answers = { start: "existing" } as const;
    expect(
      buildLeadArgs({ ...submission, way: "freelance", answers }, "h").p_offer_answers,
    ).toEqual(answers);
    expect(
      buildLeadArgs({ ...submission, way: "contratacion", answers }, "h").p_offer_answers,
    ).toBeUndefined();
  });

  it("drops the selection when the way is not project", () => {
    const args = buildLeadArgs({ ...submission, way: "freelance", company: "Acme" }, "h");
    expect(args.p_via).toBe("freelance");
    expect(args.p_page_path).toBe("/es/contacto");
    expect(args.p_offer).toBeUndefined();
    expect(args.p_organization).toBe("Acme");
  });
});

describe("resolveInitialWay", () => {
  it("accepts documented and legacy values", () => {
    expect(resolveInitialWay({ via: "hiring" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "freelance" })).toBe("freelance");
    expect(resolveInitialWay({ via: "pack" })).toBe("project");
    expect(resolveInitialWay({ via: "project" })).toBe("project");
    expect(resolveInitialWay({ via: "packs" })).toBe("project");
  });

  it("infers project from the offer and legacy pack params and ignores junk", () => {
    expect(resolveInitialWay({ pack: "web" })).toBe("project");
    expect(resolveInitialWay({ offer: "web-negocio" })).toBe("project");
    expect(resolveInitialWay({ via: "nope" })).toBeNull();
    expect(resolveInitialWay({})).toBeNull();
    expect(resolveInitialWay({ via: ["freelance", "pack"] })).toBe("freelance");
  });

  it("covers every way", () => {
    expect(Object.keys(viaByWay).sort()).toEqual(["contratacion", "freelance", "project"]);
  });
});
