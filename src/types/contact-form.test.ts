import { describe, expect, it } from "vitest";

import { collectFieldErrors, contactFormSchema, contactSubmissionSchema } from "./contact-form";

const valid = {
  way: "freelance",
  name: "  Ada ",
  email: " ada@example.com ",
  message: " Hola ",
  consent: true,
};

describe("contactFormSchema", () => {
  it("accepts and trims a valid payload", () => {
    const parsed = contactFormSchema.parse(valid);
    expect(parsed).toMatchObject({ name: "Ada", email: "ada@example.com", message: "Hola" });
  });

  it("reports one code per field", () => {
    const result = contactFormSchema.safeParse({
      way: undefined,
      name: " ",
      email: "nope",
      message: "",
      consent: false,
      company: "x".repeat(201),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(collectFieldErrors(result.error)).toEqual({
      way: "way_required",
      name: "name_required",
      email: "email_invalid",
      message: "message_required",
      consent: "consent_required",
      company: "company_too_long",
    });
  });

  it("flags empty email and over-long message", () => {
    const empty = contactFormSchema.safeParse({ ...valid, email: "" });
    expect(!empty.success && collectFieldErrors(empty.error).email).toBe("email_required");
    const long = contactFormSchema.safeParse({ ...valid, message: "x".repeat(4001) });
    expect(!long.success && collectFieldErrors(long.error).message).toBe("message_too_long");
  });

  it("rejects control characters in name and company", () => {
    for (const bad of ["Ada\u0000", "Ada\nLovelace", "Ada\u0007", "Ada\tL"]) {
      const result = contactFormSchema.safeParse({ ...valid, name: bad, company: bad });
      expect(result.success).toBe(false);
      if (result.success) continue;
      expect(collectFieldErrors(result.error)).toMatchObject({
        name: "name_invalid",
        company: "company_invalid",
      });
    }
    expect(contactFormSchema.safeParse({ ...valid, name: "José Ñandú 山田" }).success).toBe(true);
  });

  it("rejects unknown keys and bad offer slugs", () => {
    expect(contactFormSchema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...valid, offer: ["Bad Slug"] }).success).toBe(false);
    expect(
      contactFormSchema.safeParse({ ...valid, offer: ["web-negocio"], extras: ["seo"] }).success,
    ).toBe(true);
  });
});

describe("contactSubmissionSchema", () => {
  it("requires locale and a verification token", () => {
    expect(contactSubmissionSchema.safeParse(valid).success).toBe(false);
    expect(
      contactSubmissionSchema.safeParse({ ...valid, locale: "es", turnstileToken: "t" }).success,
    ).toBe(true);
    const missing = contactSubmissionSchema.safeParse({
      ...valid,
      locale: "es",
      turnstileToken: "",
    });
    expect(!missing.success && missing.error.issues[0]?.message).toBe("verification_required");
  });
});
