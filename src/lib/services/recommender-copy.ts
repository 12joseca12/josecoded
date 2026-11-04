import type { MessageKey } from "@/i18n/keys.generated";

import type { QuestionId, ReasonId } from "./recommender";

const key = (path: string) => `offersPage.recommender.${path}` as MessageKey;

export function reasonMessageKey(id: ReasonId): MessageKey {
  return key(`reasons.${id.replace(":", ".")}`);
}

export function questionLegendKey(id: QuestionId): MessageKey {
  return key(`questions.${id}.legend`);
}

export function optionLabelKey(id: QuestionId, value: string): MessageKey {
  return key(`questions.${id}.options.${value}.label`);
}

export function optionHintKey(id: QuestionId, value: string): MessageKey {
  return key(`questions.${id}.options.${value}.hint`);
}
