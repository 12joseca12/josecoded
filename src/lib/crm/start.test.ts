import { describe, expect, it } from "vitest";

import type { StartStepKey } from "@/types/crm-start";

import { buildStartSteps, type StartCopy } from "./start";

const keys: StartStepKey[] = ["telegram", "rates", "leads", "contact", "nextStep"];
const copy = Object.fromEntries(
  keys.map((key) => [key, { title: `t-${key}`, text: `x-${key}`, action: `a-${key}` }]),
) as Record<StartStepKey, StartCopy>;

describe("buildStartSteps", () => {
  it("lists every step in order with locale-prefixed CRM links", () => {
    const steps = buildStartSteps(copy, "es", { admin: false });
    expect(steps.map((step) => step.key)).toEqual(keys);
    expect(steps.every((step) => step.href.startsWith("/es/crm/"))).toBe(true);
  });

  it("drops the rates step for an admin, who has no commission rates", () => {
    const steps = buildStartSteps(copy, "en", { admin: true });
    expect(steps.map((step) => step.key)).not.toContain("rates");
    expect(steps).toHaveLength(keys.length - 1);
  });
});
