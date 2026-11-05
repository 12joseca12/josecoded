import { describe, expect, it } from "vitest";

import { telHref, whatsappHref } from "./phone";

describe("telHref", () => {
  it("keeps an international number", () => {
    expect(telHref("+34 600 111 222")).toBe("tel:+34600111222");
  });

  it("adds the Spain prefix to a nine digit number", () => {
    expect(telHref("600 111 222")).toBe("tel:+34600111222");
  });

  it("turns a 00 prefix into a plus", () => {
    expect(telHref("0044 20 7946 0958")).toBe("tel:+442079460958");
  });

  it("rejects null, letters and short numbers", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("llamar mañana")).toBeNull();
    expect(telHref("123")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("builds a wa.me link with digits only", () => {
    expect(whatsappHref("600 111 222")).toBe("https://wa.me/34600111222");
    expect(whatsappHref("+44 20 7946 0958")).toBe("https://wa.me/442079460958");
  });

  it("returns null when there is no usable number", () => {
    expect(whatsappHref(null)).toBeNull();
    expect(whatsappHref("12")).toBeNull();
  });
});
