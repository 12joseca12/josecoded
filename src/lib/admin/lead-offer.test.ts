import { describe, expect, it } from "vitest";

import type { MessageKey } from "@/i18n/keys.generated";

import { buildOfferLabels, describeAnswers, describeExtras, describeOffer } from "./lead-offer";

const labels = buildOfferLabels((key: MessageKey) => `[${key}]`);

describe("buildOfferLabels", () => {
  it("covers every tier, extra and recommender question", () => {
    expect(Object.keys(labels.offers)).toHaveLength(5);
    expect(Object.keys(labels.extras)).toHaveLength(12);
    expect(Object.keys(labels.questions)).toEqual([
      "start",
      "kind",
      "size",
      "accounts",
      "management",
      "more",
    ]);
    expect(labels.offers["web-negocio"]).toBe("[offersPage.tiers.web-negocio.name]");
  });
});

describe("describeOffer and describeExtras", () => {
  it("names known slugs, joins combined offers and keeps unknown slugs readable", () => {
    expect(describeOffer("web-negocio", labels)).toBe("[offersPage.tiers.web-negocio.name]");
    expect(describeOffer("prototipo,web-negocio", labels)).toBe(
      "prototipo + [offersPage.tiers.web-negocio.name]",
    );
    expect(describeExtras(["accounts", "mystery"], labels)).toBe(
      "[offersPage.extras.items.accounts.name], mystery",
    );
  });
});

describe("describeAnswers", () => {
  it("lists the answers in question order with their option labels", () => {
    const lines = describeAnswers(
      { more: ["payments", "ai"], start: "idea", kind: "web", other: "ignored" },
      labels,
    );
    expect(lines.map((line) => line.question)).toEqual([
      "[offersPage.recommender.questions.start.legend]",
      "[offersPage.recommender.questions.kind.legend]",
      "[offersPage.recommender.questions.more.legend]",
    ]);
    expect(lines[2]?.value).toBe(
      "[offersPage.recommender.questions.more.options.payments.label], [offersPage.recommender.questions.more.options.ai.label]",
    );
  });

  it("skips empty answers and keeps unknown values as they are", () => {
    expect(describeAnswers({ start: "idea", more: [] }, labels)).toHaveLength(1);
    expect(describeAnswers({ kind: "odd" }, labels)[0]?.value).toBe("odd");
  });
});
