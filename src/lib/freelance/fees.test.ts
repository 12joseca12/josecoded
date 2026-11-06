import { describe, expect, it } from "vitest";

import { hoursInputSchema } from "@/types/freelance-fees";

import { mapFeeError } from "./fees";

const projectId = "70000000-0000-4000-8000-000000000001";

describe("mapFeeError", () => {
  it("keeps the typed errors and maps privileges", () => {
    expect(mapFeeError({ code: "P0001", message: "hours_cap_exceeded" })).toEqual({
      status: "error",
      code: "hours_cap_exceeded",
    });
    expect(mapFeeError({ code: "42501" })).toEqual({ status: "error", code: "forbidden" });
    expect(mapFeeError({ message: "boom" })).toEqual({ status: "error", code: "error" });
  });
});

describe("hoursInputSchema", () => {
  const base = { projectId, label: "Setup", workedOn: "" };

  it("accepts one decimal with a comma and an empty date", () => {
    const parsed = hoursInputSchema.parse({ ...base, hours: "3,5" });
    expect(parsed.hours).toBe(3.5);
    expect(parsed.workedOn).toBeNull();
  });

  it("rejects zero, more than a day, empty labels and bad dates", () => {
    expect(hoursInputSchema.safeParse({ ...base, hours: "0" }).success).toBe(false);
    expect(hoursInputSchema.safeParse({ ...base, hours: "25" }).success).toBe(false);
    expect(hoursInputSchema.safeParse({ ...base, hours: "x" }).success).toBe(false);
    expect(hoursInputSchema.safeParse({ ...base, hours: "2", label: " " }).success).toBe(false);
    expect(hoursInputSchema.safeParse({ ...base, hours: "2", workedOn: "ayer" }).success).toBe(
      false,
    );
  });
});
