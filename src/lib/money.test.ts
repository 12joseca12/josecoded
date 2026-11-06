import { describe, expect, it } from "vitest";

import { formatCents, formatRate, parseMoneyToCents, percentOfCents, toCents } from "./money";

describe("parseMoneyToCents", () => {
  it.each([
    ["1000", 100000],
    ["1.000", 100000],
    ["1.000,50", 100050],
    ["1,000.50", 100050],
    ["2400,5", 240050],
    ["2400.50", 240050],
    ["12,5 €", 1250],
    ["0,99", 99],
    [",5", 50],
    ["1.234.567,89", 123456789],
    ["1,234,567", 123456700],
    ["99999999,99", 9999999999],
  ])("reads %s as %i cents", (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "1.2.3,4", "12,345", "100000000", "-5", "1e3", ","])(
    "rejects %s",
    (input) => {
      expect(parseMoneyToCents(input)).toBeNull();
    },
  );
});

describe("percentOfCents", () => {
  it("applies a rate in integer arithmetic", () => {
    expect(percentOfCents(100000, 10)).toBe(10000);
    expect(percentOfCents(100000, 5)).toBe(5000);
    expect(percentOfCents(25, 10)).toBe(3);
    expect(percentOfCents(24, 10)).toBe(2);
    expect(percentOfCents(150000, 7.5)).toBe(11250);
  });

  it("rounds half away from zero like the database", () => {
    expect(percentOfCents(5, 10)).toBe(1);
    expect(percentOfCents(-5, 10)).toBe(-1);
    expect(percentOfCents(-40000, 10)).toBe(-4000);
  });
});

describe("toCents and formatting", () => {
  it("converts numeric database values without float drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(1234.56)).toBe(123456);
  });

  it("formats euros and rates per locale", () => {
    expect(formatCents(123456, "en")).toBe("€1,234.56");
    expect(formatCents(5, "en")).toBe("€0.05");
    expect(formatRate(7.5, "en")).toBe("7.5%");
  });
});
