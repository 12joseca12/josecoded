import { describe, expect, it } from "vitest";

import { nextStepTarget } from "./next-step";

describe("nextStepTarget", () => {
  it("sends the recruiter to the CV in the page language", () => {
    expect(nextStepTarget("es", "contratacion")).toEqual({
      href: "/cv/cv-jose-carlos-sanchez-es.pdf",
      external: true,
    });
    expect(nextStepTarget("en", "contratacion").href).toBe("/cv/cv-jose-carlos-sanchez-en.pdf");
  });

  it("sends the freelance client to how I work and the project client to projects", () => {
    expect(nextStepTarget("es", "freelance")).toEqual({
      href: "/es/como-trabajo",
      external: false,
    });
    expect(nextStepTarget("es", "project")).toEqual({ href: "/es/proyectos", external: false });
  });
});
