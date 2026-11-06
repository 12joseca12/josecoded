import { describe, expect, it } from "vitest";

import type { OwnerRates, WinPreviewContext } from "@/types/deal-win";

import { previewCommission } from "./commission-preview";

const closerId = "00000000-0000-4000-8000-0000000000c1";
const subId = "00000000-0000-4000-8000-0000000000c2";
const adminId = "00000000-0000-4000-8000-0000000000a2";

const closer: OwnerRates = {
  id: closerId,
  full_name: "Cleo Closer",
  role: "closer",
  is_active: true,
  parent_closer_id: null,
  closer_rate: 10,
  parent_rate: null,
  closer_recurring_rate: 5,
  parent_recurring_rate: null,
};

const sub: OwnerRates = {
  ...closer,
  id: subId,
  full_name: "Dani Closer",
  parent_closer_id: closerId,
  closer_rate: 10,
  parent_rate: 5,
  closer_recurring_rate: 4,
  parent_recurring_rate: 2,
};

const admin: OwnerRates = {
  ...closer,
  id: adminId,
  full_name: "Jose",
  role: "admin",
  closer_rate: null,
  closer_recurring_rate: null,
};

function context(
  ownerId: string | null,
  people: OwnerRates[],
  via: WinPreviewContext["via"] = "project",
): WinPreviewContext {
  return { via, ownerId, people };
}

describe("previewCommission", () => {
  it("gives a closer without parent their own rate and recurring share", () => {
    const preview = previewCommission(context(closerId, [closer, sub]), 100000, 6000);
    expect(preview).toEqual({
      status: "ok",
      totalCents: 10000,
      lines: [
        {
          beneficiaryId: closerId,
          beneficiaryName: "Cleo Closer",
          role: "closer",
          rate: 10,
          amountCents: 10000,
          recurringRate: 5,
          recurringMonthlyCents: 300,
        },
      ],
    });
  });

  it("splits a subcloser deal between the subcloser and the parent with the frozen rates", () => {
    const preview = previewCommission(context(subId, [closer, sub]), 100000, 5000);
    expect(preview.status).toBe("ok");
    if (preview.status !== "ok") return;
    expect(preview.lines.map((line) => [line.role, line.rate, line.amountCents])).toEqual([
      ["closer", 10, 10000],
      ["parent", 5, 5000],
    ]);
    expect(preview.lines.map((line) => line.recurringMonthlyCents)).toEqual([200, 100]);
    expect(preview.totalCents).toBe(15000);
  });

  it("does not know the parent name when the viewer cannot read their profile", () => {
    const preview = previewCommission(context(subId, [sub]), 100000, null);
    expect(preview.status === "ok" && preview.lines[1]?.beneficiaryName).toBeNull();
    expect(preview.status === "ok" && preview.lines[0]?.recurringMonthlyCents).toBeNull();
  });

  it("ignores a recurring rate that is not below the project rate, like the database", () => {
    const odd = { ...closer, closer_recurring_rate: 10 };
    const preview = previewCommission(context(closerId, [odd]), 100000, 6000);
    expect(preview.status === "ok" && preview.lines[0]?.recurringRate).toBeNull();
  });

  it("creates no commission for hiring, admin-owned or unknown owners", () => {
    expect(previewCommission(context(closerId, [closer], "hiring"), 100000, null)).toEqual({
      status: "none",
      reason: "hiring",
    });
    expect(previewCommission(context(adminId, [admin]), 100000, null)).toEqual({
      status: "none",
      reason: "admin",
    });
    expect(previewCommission(context(null, [closer]), 100000, null)).toEqual({
      status: "none",
      reason: "unknown_owner",
    });
    expect(previewCommission(context(subId, [closer]), 100000, null)).toEqual({
      status: "none",
      reason: "unknown_owner",
    });
  });

  it("skips beneficiaries without a rate", () => {
    const zero = { ...closer, closer_rate: null };
    expect(previewCommission(context(closerId, [zero]), 100000, null)).toEqual({
      status: "none",
      reason: "no_rate",
    });
  });

  it("rounds each line half up in cents", () => {
    const preview = previewCommission(context(closerId, [closer]), 105, null);
    expect(preview.status === "ok" && preview.lines[0]?.amountCents).toBe(11);
  });
});
