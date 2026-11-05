import { describe, expect, it } from "vitest";

import { buildPilotHref } from "./pilot";

describe("buildPilotHref", () => {
  it("opens the freelance contact form flagged as a pilot task", () => {
    expect(buildPilotHref("es")).toBe("/es/contacto?via=freelance&task=pilot#formulario");
  });
});
