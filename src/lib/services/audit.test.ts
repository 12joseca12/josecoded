import { describe, expect, it } from "vitest";

import { buildAuditHref, isAuditRequest } from "./audit";

describe("buildAuditHref", () => {
  it("opens the freelance contact form flagged as an audit request", () => {
    expect(buildAuditHref("es")).toBe("/es/contacto?via=freelance&task=audit#formulario");
  });
});

describe("isAuditRequest", () => {
  it("is true only for task=audit", () => {
    expect(isAuditRequest({ task: "audit" })).toBe(true);
    expect(isAuditRequest({ task: ["audit", "x"] })).toBe(true);
    expect(isAuditRequest({ task: "pilot" })).toBe(false);
    expect(isAuditRequest({})).toBe(false);
  });
});
