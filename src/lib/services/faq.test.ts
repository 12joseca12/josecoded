import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import { matchFaq } from "@/lib/nexo/faq-guide";
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

  it("never carries a price, so no provisional price reaches the JSON-LD", async () => {
    const t = await getTranslator("es");
    for (const page of servicePageIds) {
      for (const item of buildFaqItems(t, page)) {
        expect(`${item.question} ${item.answer}`).not.toMatch(/€|\d+(?!\d*\s?%)/);
      }
    }
  });

  it.each(["es", "en"] as const)("resolves the shared response time in %s", async (locale) => {
    const t = await getTranslator(locale);
    const reply = buildFaqItems(t, "hub").find((item) => item.id === "reply");
    expect(reply?.answer).toContain(t("common.responseTime"));
    for (const page of servicePageIds) {
      for (const item of buildFaqItems(t, page)) {
        expect(item.answer).not.toContain("{responseTime}");
      }
    }
  });

  it("never speaks as a team", async () => {
    const t = await getTranslator("es");
    for (const page of servicePageIds) {
      for (const item of buildFaqItems(t, page)) {
        expect(`${item.question} ${item.answer}`).not.toMatch(/\bnuestr[oa]s?\b/i);
      }
    }
  });

  it("says honestly that it is not registered as self-employed yet", async () => {
    const t = await getTranslator("es");
    const invoicing = buildFaqItems(t, "hub").find((item) => item.id === "invoicing");
    expect(invoicing?.answer).toContain("Todavía no estoy dado de alta como autónomo");
    expect(invoicing?.answer).not.toMatch(/\bsoy autónomo/);
  });

  it("states the phased payment as forty, forty and twenty", async () => {
    const t = await getTranslator("es");
    const phases = buildFaqItems(t, "offers").find((item) => item.id === "phases");
    expect(phases?.answer).toMatch(/40 %.*40 %.*20 %/);
  });

  describe("assistant matching", () => {
    const probes = {
      hub: [
        ["necesitas que firme un NDA", "nda"],
        ["tenéis solape horario con mi equipo", "overlap"],
        ["y si el resultado no me convence", "dislike"],
        ["me das factura de autónomo", "invoicing"],
        ["puedes trabajar a través de una consultora", "invoicing"],
      ],
      freelance: [
        ["hay que firmar un NDA", "nda"],
        ["qué solape horario hay", "overlap"],
        ["y si crece el alcance", "scope"],
      ],
      offers: [
        ["y si te pones enfermo o desapareces", "continuity"],
        ["la app es mía de verdad", "ownership"],
        ["puedo pagar en fases", "phases"],
        ["quiero cambiar algo a mitad", "midway"],
      ],
    } as const;

    it.each(servicePageIds.map((page) => [page]))("finds each question on %s", async (page) => {
      const t = await getTranslator("es");
      const items = buildFaqItems(t, page);
      for (const item of items) {
        expect(matchFaq(items, item.question)?.id).toBe(item.id);
      }
      for (const [input, id] of probes[page]) {
        expect(matchFaq(items, input)?.id, input).toBe(id);
      }
    });
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
