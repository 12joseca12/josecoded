import type { MessageKey } from "@/i18n/keys.generated";
import type { QuestionId } from "@/lib/services/recommender";
import type { NexoEvent } from "@/types/nexo";

export type GuideMoment =
  | { kind: "arrive" }
  | { kind: "ask"; step: QuestionId }
  | { kind: "option"; step: QuestionId; value: string }
  | { kind: "compute" }
  | { kind: "result"; route: "project" | "freelance"; assumed: boolean };

export interface GuideLine {
  text: string | null;
  event: NexoEvent;
}

export interface NexoGuide {
  respond: (moment: GuideMoment) => GuideLine | Promise<GuideLine>;
}

export type GuideScript = Record<string, string>;

const k = (path: string) => `nexoGuide.${path}` as MessageKey;

export const guideScriptKeys: Record<string, MessageKey> = {
  greeting: k("greeting"),
  "ask.start": k("ask.start"),
  "ask.kind": k("ask.kind"),
  "ask.size": k("ask.size"),
  "ask.accounts": k("ask.accounts"),
  "ask.management": k("ask.management"),
  "ask.more": k("ask.more"),
  "option.start.existing": k("option.start.existing"),
  "option.kind.unsure": k("option.kind.unsure"),
  "option.size.unsure": k("option.size.unsure"),
  compute: k("compute"),
  "result.project": k("result.project"),
  "result.assumed": k("result.assumed"),
  "result.freelance": k("result.freelance"),
};

export function createScriptedGuide(script: GuideScript): NexoGuide {
  const line = (id: string) => script[id] ?? null;
  return {
    respond(moment) {
      switch (moment.kind) {
        case "arrive":
          return { text: line("greeting"), event: "visitor-arrived" };
        case "ask":
          return { text: line(`ask.${moment.step}`), event: "streaming" };
        case "option":
          return { text: line(`option.${moment.step}.${moment.value}`), event: "typing" };
        case "compute":
          return { text: line("compute"), event: "awaiting-reply" };
        case "result":
          return {
            text: line(
              moment.route === "freelance"
                ? "result.freelance"
                : moment.assumed
                  ? "result.assumed"
                  : "result.project",
            ),
            event: "positive-answer",
          };
      }
    },
  };
}
