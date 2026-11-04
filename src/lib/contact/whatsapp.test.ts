import { describe, expect, it } from "vitest";

import { buildWhatsAppUrl } from "./whatsapp";

describe("buildWhatsAppUrl", () => {
  it("returns null while the number is a pending placeholder", () => {
    expect(buildWhatsAppUrl("{{DATO: número de WhatsApp}}", "Hola")).toBeNull();
    expect(buildWhatsAppUrl("{{DATO}}", "Hola")).toBeNull();
  });

  it("keeps only digits from a formatted number", () => {
    expect(buildWhatsAppUrl("+34 600 11 22 33", "Hola")).toBe(
      "https://wa.me/34600112233?text=Hola",
    );
    expect(buildWhatsAppUrl("(+34) 600-112-233", "Hola")).toBe(
      "https://wa.me/34600112233?text=Hola",
    );
  });

  it("encodes the prefilled message", () => {
    expect(buildWhatsAppUrl("34600112233", "Hola Jose, ¿hablamos? & más")).toBe(
      "https://wa.me/34600112233?text=Hola%20Jose%2C%20%C2%BFhablamos%3F%20%26%20m%C3%A1s",
    );
  });

  it("omits the query when the message is empty", () => {
    expect(buildWhatsAppUrl("34600112233", "  ")).toBe("https://wa.me/34600112233");
  });

  it("rejects numbers that are not plausible", () => {
    expect(buildWhatsAppUrl("", "Hola")).toBeNull();
    expect(buildWhatsAppUrl("12345", "Hola")).toBeNull();
    expect(buildWhatsAppUrl("1234567890123456", "Hola")).toBeNull();
    expect(buildWhatsAppUrl("tel 600112233", "Hola")).toBeNull();
  });
});
