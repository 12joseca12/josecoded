import type { MessageKey } from "@/i18n/keys.generated";
import { extraSlugs, offerSlugs } from "@/lib/services/offers";

export interface OfferLabels {
  offers: Record<string, string>;
  extras: Record<string, string>;
  questions: Record<string, { legend: string; options: Record<string, string> }>;
}

export interface AnswerLine {
  question: string;
  value: string;
}

const answerOptions = {
  start: ["idea", "defined", "existing"],
  kind: ["web", "app", "both", "unsure"],
  size: ["small", "medium", "large", "unsure"],
  accounts: ["none", "basic", "roles"],
  management: ["me", "rare", "team"],
  more: ["payments", "languages", "seo", "analytics", "ai", "push", "offline", "stores"],
} as const;

const key = (path: string) => `offersPage.${path}` as MessageKey;

export function buildOfferLabels(t: (key: MessageKey) => string): OfferLabels {
  const questions: OfferLabels["questions"] = {};
  for (const [question, options] of Object.entries(answerOptions)) {
    questions[question] = {
      legend: t(key(`recommender.questions.${question}.legend`)),
      options: Object.fromEntries(
        options.map((option) => [
          option,
          t(key(`recommender.questions.${question}.options.${option}.label`)),
        ]),
      ),
    };
  }
  return {
    offers: Object.fromEntries(offerSlugs.map((slug) => [slug, t(key(`tiers.${slug}.name`))])),
    extras: Object.fromEntries(
      extraSlugs.map((slug) => [slug, t(key(`extras.items.${slug}.name`))]),
    ),
    questions,
  };
}

export function describeOffer(offer: string, labels: OfferLabels): string {
  return offer
    .split(",")
    .map((slug) => labels.offers[slug] ?? slug)
    .join(" + ");
}

export function describeExtras(extras: string[], labels: OfferLabels): string {
  return extras.map((slug) => labels.extras[slug] ?? slug).join(", ");
}

export function describeAnswers(
  answers: Record<string, string | string[]>,
  labels: OfferLabels,
): AnswerLine[] {
  return Object.keys(answerOptions).flatMap((name) => {
    const raw = answers[name];
    const question = labels.questions[name];
    if (raw === undefined || !question || raw.length === 0) return [];
    const values = Array.isArray(raw) ? raw : [raw];
    return [
      {
        question: question.legend,
        value: values.map((value) => question.options[value] ?? value).join(", "),
      },
    ];
  });
}
