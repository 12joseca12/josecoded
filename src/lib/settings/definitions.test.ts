import { describe, expect, it } from "vitest";

import { features } from "@/config/features";

import {
  buildSettingViews,
  definitionOf,
  featureSettingKeys,
  mergeFeatures,
  parseSettingValue,
  saveSettingSchema,
  settingDefinitions,
  settingKeys,
} from "./definitions";

describe("the closed list of settings", () => {
  it("has the fifteen keys of the table and no duplicates", () => {
    expect(settingKeys).toHaveLength(15);
    expect(new Set(settingKeys).size).toBe(15);
  });

  it("starts every switch from the value the code ships with", () => {
    expect(definitionOf("blog")?.fallback).toBe(features.blog);
    expect(definitionOf("projects")?.fallback).toBe(features.projects);
    expect(definitionOf("public_chat")?.fallback).toBe(features.chat);
    expect(definitionOf("search")?.fallback).toBe(features.search);
    expect(definitionOf("cv_download")?.fallback).toBe(features.cvDownload);
    expect(definitionOf("google_sign_in")?.fallback).toBe(features.googleSignIn);
  });

  it("knows no key outside the list", () => {
    expect(definitionOf("made.up")).toBeNull();
    expect(parseSettingValue("made.up", true)).toBeUndefined();
  });

  it("maps every feature of the code to a setting key that exists", () => {
    for (const name of Object.keys(features)) {
      expect(Object.keys(featureSettingKeys)).toContain(name);
    }
    for (const key of Object.values(featureSettingKeys)) {
      expect(settingKeys).toContain(key);
    }
  });
});

describe("parseSettingValue", () => {
  it("accepts a boolean for a switch and nothing else", () => {
    expect(parseSettingValue("blog", false)).toBe(false);
    expect(parseSettingValue("blog", "yes")).toBeUndefined();
    expect(parseSettingValue("blog", null)).toBeUndefined();
  });

  it("accepts maintenance with a boolean on and an optional until", () => {
    expect(parseSettingValue("maintenance", { on: true })).toEqual({ on: true });
    expect(
      parseSettingValue("maintenance", { on: true, until: "2026-11-06T08:00:00+01:00" }),
    ).toEqual({
      on: true,
      until: "2026-11-06T08:00:00+01:00",
    });
    expect(parseSettingValue("maintenance", { on: true, until: null })).toEqual({
      on: true,
      until: null,
    });
    expect(parseSettingValue("maintenance", { on: "yes" })).toBeUndefined();
    expect(parseSettingValue("maintenance", { on: true, extra: 1 })).toBeUndefined();
    expect(parseSettingValue("maintenance", { on: true, until: "tomorrow" })).toBeUndefined();
  });

  it("accepts the availability month, date and hours, or null to clear them", () => {
    expect(parseSettingValue("availability.next_project_month", "2027-01")).toBe("2027-01");
    expect(parseSettingValue("availability.next_project_month", "2027-13")).toBeUndefined();
    expect(parseSettingValue("availability.next_project_month", null)).toBeNull();
    expect(parseSettingValue("availability.from", "2027-01-31")).toBe("2027-01-31");
    expect(parseSettingValue("availability.from", "2027-01-32")).toBeUndefined();
    expect(parseSettingValue("availability.weekly_hours", 20)).toBe(20);
    expect(parseSettingValue("availability.weekly_hours", 81)).toBeUndefined();
    expect(parseSettingValue("availability.weekly_hours", 1.5)).toBeUndefined();
    expect(parseSettingValue("availability.weekly_hours", null)).toBeNull();
  });

  it("bounds the Nexo delay, the VAT rate and the cadence", () => {
    expect(parseSettingValue("nexo.reply_delay_min", 240)).toBe(240);
    expect(parseSettingValue("nexo.reply_delay_min", 241)).toBeUndefined();
    expect(parseSettingValue("nexo.reply_delay_min", -1)).toBeUndefined();
    expect(parseSettingValue("nexo.reply_delay_min", null)).toBeUndefined();
    expect(parseSettingValue("billing.vat_rate", 0)).toBe(0);
    expect(parseSettingValue("billing.vat_rate", 21)).toBe(21);
    expect(parseSettingValue("billing.vat_rate", 101)).toBeUndefined();
    expect(parseSettingValue("payout.default_cadence", "weekly")).toBe("weekly");
    expect(parseSettingValue("payout.default_cadence", "monthly")).toBeUndefined();
  });
});

describe("saveSettingSchema", () => {
  it("takes a known key and any value, and nothing more", () => {
    expect(saveSettingSchema.safeParse({ key: "blog", value: true }).success).toBe(true);
    expect(saveSettingSchema.safeParse({ key: "made.up", value: true }).success).toBe(false);
    expect(saveSettingSchema.safeParse({ key: "blog", value: true, extra: 1 }).success).toBe(false);
  });
});

describe("buildSettingViews", () => {
  it("falls back to the code for every setting when the table is not there", () => {
    const views = buildSettingViews(null);
    expect(views).toHaveLength(settingDefinitions.length);
    expect(views.every((view) => view.updatedAt === null)).toBe(true);
    expect(views.find((view) => view.key === "blog")?.value).toBe(features.blog);
  });

  it("uses a stored value and its date, and ignores a stored value of the wrong type", () => {
    const views = buildSettingViews([
      { key: "blog", value: false, updated_at: "2026-11-05T10:00:00+00:00" },
      { key: "billing.vat_rate", value: "lots", updated_at: "2026-11-05T10:00:00+00:00" },
    ]);
    expect(views.find((view) => view.key === "blog")).toMatchObject({
      value: false,
      updatedAt: "2026-11-05T10:00:00+00:00",
    });
    expect(views.find((view) => view.key === "billing.vat_rate")).toMatchObject({
      value: 21,
      updatedAt: null,
    });
  });

  it("marks only Google sign-in as read by the site today", () => {
    const wired = buildSettingViews(null)
      .filter((view) => view.wired)
      .map((view) => view.key);
    expect(wired).toEqual(["google_sign_in"]);
  });
});

describe("mergeFeatures", () => {
  it("returns the code when the read failed", () => {
    expect(mergeFeatures(features, null)).toBe(features);
  });

  it("overrides a feature with a stored boolean", () => {
    const merged = mergeFeatures(features, [
      { key: "blog", value: !features.blog },
      { key: "public_chat", value: !features.chat },
    ]);
    expect(merged.blog).toBe(!features.blog);
    expect(merged.chat).toBe(!features.chat);
    expect(merged.search).toBe(features.search);
  });

  it("ignores values that are not booleans and keys that are not features", () => {
    const merged = mergeFeatures(features, [
      { key: "blog", value: "no" },
      { key: "lab", value: true },
      { key: "billing.vat_rate", value: 21 },
    ]);
    expect(merged).toEqual(features);
  });

  it("does not mutate the features of the code", () => {
    const before = { ...features };
    mergeFeatures(features, [{ key: "blog", value: !features.blog }]);
    expect(features).toEqual(before);
  });
});
