import { describe, expect, it } from "vitest";

import { collectHandoffErrors, handoffInputSchema } from "@/types/chat";

describe("handoffInputSchema", () => {
  it("accepts an email with consent", () => {
    const parsed = handoffInputSchema.safeParse({ email: "a@b.es", consent: true });
    expect(parsed.success).toBe(true);
  });

  it("accepts a phone alone and drops blank fields", () => {
    const parsed = handoffInputSchema.safeParse({
      name: " ",
      email: "",
      phone: "+34 600 000 000",
      consent: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.name).toBeUndefined();
  });

  it("requires a way to reach the visitor and the consent", () => {
    const parsed = handoffInputSchema.safeParse({ email: "", phone: "", consent: false });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(collectHandoffErrors(parsed.error)).toMatchObject({ consent: "consent_required" });
    }
    const noContact = handoffInputSchema.safeParse({ consent: true });
    expect(noContact.success).toBe(false);
    if (!noContact.success) {
      expect(collectHandoffErrors(noContact.error)).toEqual({ email: "contact_required" });
    }
  });

  it("rejects malformed values", () => {
    const parsed = handoffInputSchema.safeParse({ email: "nope", phone: "12", consent: true });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(collectHandoffErrors(parsed.error)).toEqual({
        email: "email_invalid",
        phone: "phone_invalid",
      });
    }
  });
});

describe("handoff errors together", () => {
  it("reports the missing contact and the missing consent at once", () => {
    const parsed = handoffInputSchema.safeParse({ email: "", phone: "", consent: false });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(collectHandoffErrors(parsed.error)).toEqual({
        email: "contact_required",
        consent: "consent_required",
      });
    }
  });
});
