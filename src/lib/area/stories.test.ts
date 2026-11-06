import { describe, expect, it } from "vitest";

import { storyInputSchema } from "@/types/area";

const valid = {
  title: "Ver mi pedido",
  asA: "cliente",
  iWant: "ver mi pedido",
  soThat: "no preguntar",
  criteria: ["Muestra el estado", "  ", " Funciona en móvil "],
};

describe("storyInputSchema", () => {
  it("trims and drops blank criteria", () => {
    const parsed = storyInputSchema.parse(valid);
    expect(parsed.criteria).toEqual(["Muestra el estado", "Funciona en móvil"]);
  });

  it("accepts a story without criteria", () => {
    expect(storyInputSchema.safeParse({ ...valid, criteria: [] }).success).toBe(true);
  });

  it("requires title, as, want and so that", () => {
    for (const field of ["title", "asA", "iWant", "soThat"] as const) {
      const result = storyInputSchema.safeParse({ ...valid, [field]: "  " });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path[0]).toBe(field);
    }
  });

  it("caps criteria at twelve and the text lengths", () => {
    const many = Array.from({ length: 13 }, (_, index) => `criterio ${index}`);
    const tooMany = storyInputSchema.safeParse({ ...valid, criteria: many });
    expect(tooMany.error?.issues[0]?.path[0]).toBe("criteria");
    expect(storyInputSchema.safeParse({ ...valid, title: "a".repeat(201) }).success).toBe(false);
    expect(storyInputSchema.safeParse({ ...valid, iWant: "a".repeat(501) }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(storyInputSchema.safeParse({ ...valid, status: "accepted" }).success).toBe(false);
  });
});
