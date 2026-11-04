import { describe, expect, it } from "vitest";

import { hasLiveChannel, resolveChannels } from "./channels";

const pending = {
  whatsappNumber: "{{DATO: número de WhatsApp}}",
  email: "{{DATO: email de contacto}}",
};

describe("resolveChannels", () => {
  it("hides every channel while the data is pending", () => {
    expect(resolveChannels(pending, "Hola")).toEqual({
      whatsappHref: null,
      emailHref: null,
      email: null,
    });
    expect(hasLiveChannel(pending)).toBe(false);
  });

  it("exposes WhatsApp and email once they are real", () => {
    const live = { whatsappNumber: "+34 600 11 22 33", email: "hola@josecoded.com" };
    expect(resolveChannels(live, "Hola")).toEqual({
      whatsappHref: "https://wa.me/34600112233?text=Hola",
      emailHref: "mailto:hola@josecoded.com",
      email: "hola@josecoded.com",
    });
    expect(hasLiveChannel(live)).toBe(true);
  });

  it("is live with only one channel and rejects a malformed email", () => {
    expect(hasLiveChannel({ ...pending, email: "hola@josecoded.com" })).toBe(true);
    expect(hasLiveChannel({ ...pending, whatsappNumber: "34600112233" })).toBe(true);
    expect(hasLiveChannel({ ...pending, email: "not-an-email" })).toBe(false);
  });
});
