import { describe, expect, it } from "vitest";

import { buildPilotHref, isPilotRequest } from "./pilot";

describe("buildPilotHref", () => {
  it("opens the freelance contact form flagged as a pilot task", () => {
    expect(buildPilotHref("es")).toBe("/es/contacto?via=freelance&task=pilot#formulario");
  });
});

describe("isPilotRequest", () => {
  it("is true only for task=pilot", () => {
    expect(isPilotRequest({ task: "pilot" })).toBe(true);
    expect(isPilotRequest({ task: ["pilot", "x"] })).toBe(true);
    expect(isPilotRequest({ task: "other" })).toBe(false);
    expect(isPilotRequest({})).toBe(false);
  });
});
