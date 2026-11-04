import { describe, expect, it } from "vitest";

import type { ContactSubmission } from "@/types/contact-form";

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
  way: "packs",
  name: "Ada",
  email: "ada@example.com",
  company: "  ",
  message: "Hola",
  consent: true,
  pack: "web-basico",
  locale: "es",
  turnstileToken: "t",
};

describe("buildLeadArgs", () => {
  it("maps way to via and carries consent and hash", () => {
    const args = buildLeadArgs(submission, "h".repeat(64));
    expect(args).toMatchObject({
      p_source: "form",
      p_via: "pack",
      p_full_name: "Ada",
      p_email: "ada@example.com",
      p_message: "Hola",
      p_locale: "es",
      p_consent: true,
      p_ip_hash: "h".repeat(64),
      p_page_path: "/es/contacto?pack=web-basico",
    });
    expect(args.p_organization).toBeUndefined();
  });

  it("drops the pack when the way is not packs", () => {
    const args = buildLeadArgs({ ...submission, way: "freelance", company: "Acme" }, "h");
    expect(args.p_via).toBe("freelance");
    expect(args.p_page_path).toBe("/es/contacto");
    expect(args.p_organization).toBe("Acme");
  });
});

describe("resolveInitialWay", () => {
  it("accepts documented and legacy values", () => {
    expect(resolveInitialWay({ via: "hiring" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "freelance" })).toBe("freelance");
    expect(resolveInitialWay({ via: "pack" })).toBe("packs");
    expect(resolveInitialWay({ via: "packs" })).toBe("packs");
  });

  it("infers packs from the pack param and ignores junk", () => {
    expect(resolveInitialWay({ pack: "web" })).toBe("packs");
    expect(resolveInitialWay({ via: "nope" })).toBeNull();
    expect(resolveInitialWay({})).toBeNull();
    expect(resolveInitialWay({ via: ["freelance", "pack"] })).toBe("freelance");
  });

  it("covers every way", () => {
    expect(Object.keys(viaByWay).sort()).toEqual(["contratacion", "freelance", "packs"]);
  });
});
