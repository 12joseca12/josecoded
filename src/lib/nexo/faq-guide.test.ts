import { describe, expect, it } from "vitest";

import type { FaqItem } from "@/types/services";

import { createFaqGuide, matchFaq, normalise, stems } from "./faq-guide";

const items: FaqItem[] = [
  {
    id: "remote",
    question: "¿Trabajas en remoto o tengo que estar en Madrid?",
    answer: "Trabajo en remoto con clientes de toda España.",
  },
  {
    id: "invoicing",
    question: "¿Facturas con IVA?",
    answer: "Sí. Cada trabajo se factura con IVA y factura detallada.",
  },
  {
    id: "languages",
    question: "¿En qué idiomas puedo escribirte?",
    answer: "En español y en inglés.",
  },
  {
    id: "reply",
    question: "¿Cuánto tardas en responder?",
    answer: "Respondo cada consulta en uno o dos días laborables.",
  },
];

describe("normalise", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(normalise("¿Cuánto  TARDAS?")).toBe("cuanto tardas");
  });
});

describe("stems", () => {
  it("drops stop words and short words and cuts to a stem", () => {
    expect([...stems("¿Cuánto tardas en responder?")]).toEqual(["tarda", "respo"]);
  });
});

describe("matchFaq", () => {
  it("matches an exact question", () => {
    expect(matchFaq(items, "¿Facturas con IVA?")?.id).toBe("invoicing");
  });

  it("matches a keyword typed with different accents and endings", () => {
    expect(matchFaq(items, "puedes facturar con iva")?.id).toBe("invoicing");
    expect(matchFaq(items, "en que idioma hablas")?.id).toBe("languages");
    expect(matchFaq(items, "TARDAS mucho?")?.id).toBe("reply");
    expect(matchFaq(items, "cuanto tardas y respondes")?.id).toBe("reply");
  });

  it("returns null when nothing is close", () => {
    expect(matchFaq(items, "hola")).toBeNull();
    expect(matchFaq(items, "me gusta el futbol")).toBeNull();
    expect(matchFaq(items, "")).toBeNull();
  });
});

describe("createFaqGuide", () => {
  const guide = createFaqGuide(items);

  it("suggests every question", () => {
    expect(guide.suggestions.map((entry) => entry.id)).toEqual([
      "remote",
      "invoicing",
      "languages",
      "reply",
    ]);
  });

  it("answers with the matching entry and hands off otherwise", async () => {
    expect(await guide.reply("¿Cuánto tardas en responder?")).toEqual({
      kind: "answer",
      id: "reply",
      text: items[3]?.answer,
    });
    expect(await guide.reply("kubernetes")).toEqual({ kind: "handoff" });
  });
});
