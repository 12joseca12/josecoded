import type { MessageKey } from "@/i18n/keys.generated";
import { withResponseTime } from "@/lib/common/response-time";
import type { DiagramLayer, PointItem, ProblemItem, TimelinePhase } from "@/types/how";
import type { FaqItem } from "@/types/services";

type Translate = (key: MessageKey) => string;

const k = (path: string) => `howPage.${path}` as MessageKey;

export const phaseIds = ["discover", "design", "build", "publish", "maintain"] as const;
export const problemIds = ["csp", "motion", "recommender"] as const;
export const stackIds = ["next", "supabase", "mobile", "typescript", "tests", "ci"] as const;
export const qualityIds = ["accessibility", "performance", "security", "code", "tokens"] as const;
export const faqIds = ["start", "changes", "ownership", "after"] as const;

export const diagramLayerIds = ["clients", "app", "data"] as const;
export const diagramNodeIds = {
  clients: ["browser", "mobile"],
  app: ["workers", "ci"],
  data: ["postgres", "services"],
} as const;

export function buildPhases(t: Translate): TimelinePhase[] {
  return phaseIds.map((id) => ({
    id,
    title: t(`home.hero.phases.${id}` as MessageKey),
    summary: t(k(`phases.items.${id}.summary`)),
    gets: [1, 2, 3].map((n) => t(k(`phases.items.${id}.gets${n}`))),
    needs: t(k(`phases.items.${id}.needs`)),
  }));
}

export function buildProblems(t: Translate): ProblemItem[] {
  return problemIds.map((id) => ({
    id,
    title: t(k(`problems.items.${id}.title`)),
    problem: t(k(`problems.items.${id}.problem`)),
    decision: t(k(`problems.items.${id}.decision`)),
    result: t(k(`problems.items.${id}.result`)),
  }));
}

export function buildStackPoints(t: Translate): PointItem[] {
  return stackIds.map((id) => ({
    id,
    title: t(k(`tech.stack.${id}.title`)),
    text: t(k(`tech.stack.${id}.text`)),
  }));
}

export function buildQualityPoints(t: Translate): PointItem[] {
  return qualityIds.map((id) => ({
    id,
    title: t(k(`quality.items.${id}.title`)),
    text: t(k(`quality.items.${id}.text`)),
  }));
}

export function buildDiagramLayers(t: Translate): DiagramLayer[] {
  return diagramLayerIds.map((id) => ({
    id,
    title: t(k(`tech.diagram.layers.${id}`)),
    nodes: diagramNodeIds[id].map((nodeId) => ({
      id: nodeId,
      name: t(k(`tech.diagram.nodes.${nodeId}.name`)),
      detail: t(k(`tech.diagram.nodes.${nodeId}.detail`)),
    })),
  }));
}

export function buildHowFaq(t: Translate): FaqItem[] {
  return faqIds.map((id, index) => ({
    id,
    question: t(k(`faq.q${index + 1}`)),
    answer: withResponseTime(t, t(k(`faq.a${index + 1}`))),
  }));
}
