import { describe, expect, it } from "vitest";

import type { MessageKey } from "@/i18n/keys.generated";

import es from "../../../messages/es.json";
import {
  buildDiagramLayers,
  buildHowFaq,
  buildPhases,
  buildProblems,
  buildQualityPoints,
  buildStackPoints,
  diagramNodeIds,
  phaseIds,
} from "./content";

function lookup(key: MessageKey): string {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], es);
  if (typeof value !== "string") throw new Error(`missing message ${key}`);
  return value;
}

describe("how page content", () => {
  it("resolves the five phases in order with three deliverables each", () => {
    const phases = buildPhases(lookup);
    expect(phases.map((phase) => phase.id)).toEqual([...phaseIds]);
    expect(phases.map((phase) => phase.title)).toEqual([
      "Descubrir",
      "Diseñar",
      "Construir",
      "Publicar",
      "Mantener",
    ]);
    for (const phase of phases) {
      expect(phase.gets).toHaveLength(3);
      expect(phase.summary.length).toBeGreaterThan(0);
      expect(phase.needs.length).toBeGreaterThan(0);
    }
  });

  it("resolves every problem, point and FAQ entry without empty copy", () => {
    expect(buildProblems(lookup)).toHaveLength(3);
    expect(buildStackPoints(lookup)).toHaveLength(6);
    expect(buildQualityPoints(lookup)).toHaveLength(5);
    expect(buildHowFaq(lookup)).toHaveLength(4);
    for (const item of buildProblems(lookup)) {
      expect([item.title, item.problem, item.decision, item.result].every(Boolean)).toBe(true);
    }
  });

  it("describes the diagram in three layers with all of its nodes", () => {
    const layers = buildDiagramLayers(lookup);
    expect(layers.map((layer) => layer.id)).toEqual(["clients", "app", "data"]);
    expect(layers.flatMap((layer) => layer.nodes.map((node) => node.id))).toEqual(
      Object.values(diagramNodeIds).flat(),
    );
  });
});
