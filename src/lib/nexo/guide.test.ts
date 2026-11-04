import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import { questionIds } from "@/lib/services/recommender";

import {
  createScriptedGuide,
  type GuideMoment,
  guideScriptKeys,
  type RecommenderGuide,
} from "./guide";
import { nexoStateFor } from "./state";

const script = {
  greeting: "hola",
  "ask.kind": "por qué",
  "option.kind.unsure": "sin problema",
  compute: "calculando",
  "result.project": "listo",
  "result.assumed": "supuesto",
  "result.freelance": "horas",
};

describe("scripted guide", () => {
  const guide = createScriptedGuide(script);

  it("greets, explains, listens, thinks and celebrates with the matching Nexo states", async () => {
    const states = await Promise.all(
      [
        { kind: "arrive" },
        { kind: "ask", step: "kind" },
        { kind: "option", step: "kind", value: "unsure" },
        { kind: "compute" },
        { kind: "result", route: "project", assumed: false },
      ].map(async (moment) => {
        const line = await guide.reply(moment as GuideMoment);
        return nexoStateFor(line.event);
      }),
    );
    expect(states).toEqual(["greeting", "talking", "listening", "thinking", "happy"]);
  });

  it("explains why a question matters and reacts to the unsure answers", async () => {
    expect(await guide.reply({ kind: "ask", step: "kind" })).toMatchObject({ text: "por qué" });
    expect(await guide.reply({ kind: "option", step: "kind", value: "unsure" })).toMatchObject({
      text: "sin problema",
    });
  });

  it("keeps the current text when an option has no reaction of its own", async () => {
    expect(await guide.reply({ kind: "option", step: "size", value: "small" })).toEqual({
      text: null,
      event: "typing",
    });
  });

  it("picks the result line from the route and the assumptions", async () => {
    const text = async (route: "project" | "freelance", assumed: boolean) =>
      (await guide.reply({ kind: "result", route, assumed })).text;
    expect(await text("project", false)).toBe("listo");
    expect(await text("project", true)).toBe("supuesto");
    expect(await text("freelance", false)).toBe("horas");
  });

  it("can be replaced by any provider that implements the interface", async () => {
    const later: RecommenderGuide = {
      suggestions: [],
      reply: () => Promise.resolve({ text: "ia", event: "streaming" }),
    };
    expect((await later.reply({ kind: "compute" })).text).toBe("ia");
  });
});

describe.each(["es", "en"] as const)("guide copy in %s", (locale) => {
  it("exists for every scripted line, including one for each question", async () => {
    const t = await getTranslator(locale);
    for (const key of Object.values(guideScriptKeys)) expect(t(key).length).toBeGreaterThan(0);
    for (const step of questionIds) expect(guideScriptKeys[`ask.${step}`]).toBeDefined();
  });
});
