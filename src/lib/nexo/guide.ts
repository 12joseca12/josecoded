export interface NexoGuideSuggestion {
  id: string;
  text: string;
}

export type NexoGuideReply = { kind: "answer"; id: string; text: string } | { kind: "handoff" };

export interface NexoGuide {
  suggestions: readonly NexoGuideSuggestion[];
  reply(input: string): Promise<NexoGuideReply>;
}
