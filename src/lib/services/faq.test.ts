import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import { servicePageIds } from "@/types/services";

import { buildFaqItems, faqKeys } from "./faq";

describe("faq", () => {
  it.each(["es", "en"] as const)("builds every question and answer in %s", async (locale) => {
    const t = await getTranslator(locale);
    for (const page of servicePageIds) {
      const items = buildFaqItems(t, page);
      expect(items).toHaveLength(faqKeys[page].length);
      for (const item of items) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("never carries a figure, so no provisional price reaches the JSON-LD", async () => {
    const t = await getTranslator("es");
    for (const page of servicePageIds) {
      for (const item of buildFaqItems(t, page)) {
        expect(`${item.question} ${item.answer}`).not.toMatch(/\d|€/);
      }
    }
  });

  it("does not repeat a question across pages", async () => {
    const t = await getTranslator("es");
    const questions = servicePageIds.flatMap((page) =>
      buildFaqItems(t, page).map((item) => item.question),
    );
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("keeps ids unique inside a page", () => {
    for (const page of servicePageIds) {
      const ids = faqKeys[page].map((entry) => entry.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
