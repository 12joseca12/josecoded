import { describe, expect, it } from "vitest";

import { contact } from "@/config/contact";
import { contactWaysSchema } from "@/types/contact";

import { hasLiveChannel, primaryEmail, resolveChannels } from "./channels";

const pendingNumber = "{{DATO: número de WhatsApp}}";
const ways = contactWaysSchema.parse([
  { way: "contratacion", email: "hola@josecoded.com" },
  { way: "freelance", email: "freelance@josecoded.com" },
  { way: "project", email: "proyectos@josecoded.com" },
]);

describe("contact config", () => {
  it("has one email per way with Jose's addresses", () => {
    expect(contact.ways).toEqual(ways);
  });

  it("rejects a malformed email, an unknown way and a repeated way", () => {
    expect(contactWaysSchema.safeParse([{ way: "freelance", email: "nope" }]).success).toBe(false);
    expect(contactWaysSchema.safeParse([{ way: "other", email: "a@b.co" }]).success).toBe(false);
    expect(
      contactWaysSchema.safeParse([
        { way: "freelance", email: "a@b.co" },
        { way: "freelance", email: "c@d.co" },
      ]).success,
    ).toBe(false);
  });
});

describe("resolveChannels", () => {
  it("hides WhatsApp while the number is pending and keeps a mailto per way", () => {
    const channels = resolveChannels({ whatsappNumber: pendingNumber, ways }, "Hola");
    expect(channels.whatsappHref).toBeNull();
    expect(channels.ways.map((entry) => entry.href)).toEqual([
      "mailto:hola@josecoded.com",
      "mailto:freelance@josecoded.com",
      "mailto:proyectos@josecoded.com",
    ]);
  });

  it("exposes WhatsApp automatically once the number is real", () => {
    const channels = resolveChannels({ whatsappNumber: "+34 600 11 22 33", ways }, "Hola");
    expect(channels.whatsappHref).toBe("https://wa.me/34600112233?text=Hola");
  });

  it("is live with only the emails, and not without any channel", () => {
    expect(hasLiveChannel({ whatsappNumber: pendingNumber, ways })).toBe(true);
    expect(hasLiveChannel({ whatsappNumber: "34600112233", ways: [] })).toBe(true);
    expect(hasLiveChannel({ whatsappNumber: pendingNumber, ways: [] })).toBe(false);
  });
});

describe("primaryEmail", () => {
  it("prefers the hiring address", () => {
    expect(primaryEmail(ways)).toBe("hola@josecoded.com");
    expect(primaryEmail([...ways].reverse())).toBe("hola@josecoded.com");
    expect(primaryEmail([])).toBeNull();
  });
});
