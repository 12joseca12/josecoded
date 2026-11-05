import type { MessageKey } from "@/i18n/keys.generated";
import {
  extraCopyKeys,
  type ExtraSlug,
  extraSlugs,
  offerCopyKeys,
  type OfferSlug,
  offerSlugs,
} from "@/lib/services/offers";
import { type QuestionId, questions, type ReasonId } from "@/lib/services/recommender";
import {
  optionHintKey,
  optionLabelKey,
  questionLegendKey,
  reasonMessageKey,
} from "@/lib/services/recommender-copy";

type Translate = (key: MessageKey) => string;

export interface RecommenderCopy {
  label: string;
  progress: string;
  progressDone: string;
  next: string;
  back: string;
  see: string;
  required: string;
  multipleHint: string;
  priceReview: { label: string; note: string };
  questions: Record<
    QuestionId,
    { legend: string; options: Record<string, { label: string; hint: string }> }
  >;
  offers: Record<OfferSlug, { name: string; platform: string; excludes: string[] }>;
  extras: Record<ExtraSlug, { name: string }>;
  reasons: Record<string, string>;
  result: Record<
    | "kicker"
    | "title"
    | "from"
    | "unit"
    | "monthly"
    | "weeks"
    | "whyTitle"
    | "includedTitle"
    | "excludesTitle"
    | "extrasTitle"
    | "extrasHint"
    | "update"
    | "cta"
    | "change"
    | "assumedTitle"
    | "assumedText"
    | "talk"
    | "freelanceTitle"
    | "freelanceText"
    | "freelanceCta"
    | "freelanceContact",
    string
  >;
}

const resultKeys = [
  "kicker",
  "title",
  "from",
  "unit",
  "monthly",
  "weeks",
  "whyTitle",
  "includedTitle",
  "excludesTitle",
  "extrasTitle",
  "extrasHint",
  "update",
  "cta",
  "change",
  "assumedTitle",
  "assumedText",
  "talk",
  "freelanceTitle",
  "freelanceText",
  "freelanceCta",
  "freelanceContact",
] as const;

const reasonIds: ReasonId[] = [
  "existing",
  "platform_web",
  "platform_app",
  "platform_both",
  "assumed_kind",
  "assumed_size",
  "bump_roles",
  "bump_team",
  "management_rare",
  "included",
  "maintenance_both",
  ...offerSlugs.map((slug): ReasonId => `tier:${slug}`),
  ...extraSlugs
    .filter((slug) => slug !== "maintenance" && slug !== "brand")
    .map((slug): ReasonId => `extra:${slug}`),
];

const key = (path: string) => `offersPage.${path}` as MessageKey;

export function buildRecommenderCopy(t: Translate): RecommenderCopy {
  return {
    label: t(key("recommender.label")),
    progress: t(key("recommender.progress")),
    progressDone: t(key("recommender.progressDone")),
    next: t(key("recommender.next")),
    back: t(key("recommender.back")),
    see: t(key("recommender.see")),
    required: t(key("recommender.required")),
    multipleHint: t(key("recommender.multipleHint")),
    priceReview: { label: t("services.price.review"), note: t("services.price.reviewNote") },
    questions: Object.fromEntries(
      questions.map((question) => [
        question.id,
        {
          legend: t(questionLegendKey(question.id)),
          options: Object.fromEntries(
            question.options.map((value) => [
              value,
              {
                label: t(optionLabelKey(question.id, value)),
                hint: t(optionHintKey(question.id, value)),
              },
            ]),
          ),
        },
      ]),
    ) as RecommenderCopy["questions"],
    offers: Object.fromEntries(
      offerSlugs.map((slug) => {
        const copy = offerCopyKeys(slug);
        return [
          slug,
          {
            name: t(copy.name),
            platform: t(key(slug.startsWith("web") ? "compare.tabWeb" : "compare.tabApp")),
            excludes: copy.excludes.map((entry) => t(entry)),
          },
        ];
      }),
    ) as RecommenderCopy["offers"],
    extras: Object.fromEntries(
      extraSlugs.map((slug) => [slug, { name: t(extraCopyKeys(slug).name) }]),
    ) as RecommenderCopy["extras"],
    reasons: Object.fromEntries(reasonIds.map((id) => [id, t(reasonMessageKey(id))])),
    result: Object.fromEntries(
      resultKeys.map((name) => [name, t(key(`recommender.result.${name}`))]),
    ) as RecommenderCopy["result"],
  };
}
