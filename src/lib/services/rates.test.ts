import { describe, expect, it } from "vitest";

import { isProvisional, publicRates, rates, ratesSchema } from "./rates";

describe("rates", () => {
  it("ships as provisional placeholders", () => {
    expect(rates).toEqual({ status: "provisional", hour: "00", task: "000" });
    expect(isProvisional(rates)).toBe(true);
  });

  it("exposes no machine-readable price while provisional", () => {
    expect(publicRates(rates)).toBeNull();
  });

  it("exposes the figures once final", () => {
    expect(publicRates({ status: "final", hour: "60", task: "300" })).toEqual({
      hour: "60",
      task: "300",
    });
  });

  it("rejects an unknown status", () => {
    expect(ratesSchema.safeParse({ status: "draft", hour: "1", task: "2" }).success).toBe(false);
  });
});
