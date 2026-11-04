import {
  extraAppliesTo,
  extraIncludedIn,
  extraOf,
  extras,
  type ExtraSlug,
  type OfferSlug,
  type Platform,
} from "./offers";

export const questionIds = ["start", "kind", "size", "accounts", "management", "more"] as const;
export type QuestionId = (typeof questionIds)[number];

export const startValues = ["idea", "defined", "existing"] as const;
export const kindValues = ["web", "app", "both", "unsure"] as const;
export const sizeValues = ["small", "medium", "large", "unsure"] as const;
export const accountsValues = ["none", "basic", "roles"] as const;
export const managementValues = ["me", "rare", "team"] as const;
export const moreValues = [
  "payments",
  "languages",
  "seo",
  "analytics",
  "ai",
  "push",
  "offline",
  "stores",
] as const satisfies readonly ExtraSlug[];

export type StartValue = (typeof startValues)[number];
export type KindValue = (typeof kindValues)[number];
export type SizeValue = (typeof sizeValues)[number];
export type AccountsValue = (typeof accountsValues)[number];
export type ManagementValue = (typeof managementValues)[number];
export type MoreValue = (typeof moreValues)[number];

export interface Draft {
  start?: StartValue;
  kind?: KindValue;
  size?: SizeValue;
  accounts?: AccountsValue;
  management?: ManagementValue;
  more?: readonly MoreValue[];
}

export interface ProjectAnswers {
  start: Exclude<StartValue, "existing">;
  kind: KindValue;
  size: SizeValue;
  accounts: AccountsValue;
  management: ManagementValue;
  more: readonly MoreValue[];
}

export type Answers = { start: "existing" } | ProjectAnswers;

export interface Question {
  id: QuestionId;
  multiple: boolean;
  options: readonly string[];
}

export const questions: readonly Question[] = [
  { id: "start", multiple: false, options: startValues },
  { id: "kind", multiple: false, options: kindValues },
  { id: "size", multiple: false, options: sizeValues },
  { id: "accounts", multiple: false, options: accountsValues },
  { id: "management", multiple: false, options: managementValues },
  { id: "more", multiple: true, options: moreValues },
];

const webOnlyMore: readonly MoreValue[] = ["seo"];
const appOnlyMore: readonly MoreValue[] = ["push", "offline", "stores"];

export function moreFitsKind(value: MoreValue, kind: KindValue | undefined): boolean {
  if (kind === "web") return !appOnlyMore.includes(value);
  if (kind === "app") return !webOnlyMore.includes(value);
  return true;
}

export function optionsFor(id: QuestionId, draft: Draft): readonly string[] {
  const question = questions.find((entry) => entry.id === id);
  if (!question) return [];
  if (id === "more") return moreValues.filter((value) => moreFitsKind(value, draft.kind));
  return question.options;
}

export type ReasonId =
  | "existing"
  | "platform_web"
  | "platform_app"
  | "platform_both"
  | "assumed_kind"
  | "assumed_size"
  | `tier:${OfferSlug}`
  | "bump_roles"
  | "bump_team"
  | "management_rare"
  | `extra:${ExtraSlug}`
  | "included"
  | "maintenance_both";

export interface Reason {
  id: ReasonId;
  extra?: ExtraSlug;
}

export interface FreelanceRecommendation {
  route: "freelance";
  reasons: Reason[];
}

export interface ProjectRecommendation {
  route: "project";
  offers: OfferSlug[];
  extras: ExtraSlug[];
  available: ExtraSlug[];
  included: ExtraSlug[];
  assumed: { kind: boolean; size: boolean };
  reasons: Reason[];
}

export type Recommendation = FreelanceRecommendation | ProjectRecommendation;

export function inferKind(more: readonly MoreValue[]): Exclude<KindValue, "unsure"> {
  const mobile = more.some((value) => appOnlyMore.includes(value));
  if (mobile && more.includes("seo")) return "both";
  return mobile ? "app" : "web";
}

const webTierBySize = {
  small: "web-presencia",
  medium: "web-negocio",
  large: "web-plataforma",
} as const satisfies Record<Exclude<SizeValue, "unsure">, OfferSlug>;

function tierFor(
  platform: Platform,
  size: Exclude<SizeValue, "unsure">,
  answers: ProjectAnswers,
): { slug: OfferSlug; bump: "bump_roles" | "bump_team" | null } {
  const bump =
    answers.accounts === "roles"
      ? "bump_roles"
      : answers.management === "team"
        ? "bump_team"
        : null;
  if (platform === "web") {
    const base = webTierBySize[size];
    if (bump && base !== "web-plataforma") return { slug: "web-plataforma", bump };
    return { slug: base, bump: null };
  }
  const base = size === "large" ? "app-producto" : "app-primera-version";
  if (bump && base !== "app-producto") return { slug: "app-producto", bump };
  return { slug: base, bump: null };
}

interface ExtraRule {
  id: string;
  when: (answers: ProjectAnswers) => boolean;
  add: ExtraSlug;
}

export const extraRules: readonly ExtraRule[] = [
  { id: "R5", when: (a) => a.accounts === "basic", add: "accounts" },
  { id: "R7a", when: (a) => a.management === "me", add: "admin" },
  ...moreValues.map((value): ExtraRule => ({
    id: `R8:${value}`,
    when: (a) => a.more.includes(value),
    add: value,
  })),
];

function pushUnique<T>(list: T[], value: T) {
  if (!list.includes(value)) list.push(value);
}

export function recommend(answers: Answers): Recommendation {
  if (answers.start === "existing") {
    return { route: "freelance", reasons: [{ id: "existing" }] };
  }

  const reasons: Reason[] = [];
  const assumedKind = answers.kind === "unsure";
  const assumedSize = answers.size === "unsure";
  const kind = answers.kind === "unsure" ? inferKind(answers.more) : answers.kind;
  const size = answers.size === "unsure" ? "medium" : answers.size;

  if (assumedKind) reasons.push({ id: "assumed_kind" });
  reasons.push({ id: `platform_${kind}` });
  if (assumedSize) reasons.push({ id: "assumed_size" });

  const platforms: Platform[] = kind === "both" ? ["web", "app"] : [kind];
  const chosen: OfferSlug[] = [];
  for (const platform of platforms) {
    const tier = tierFor(platform, size, answers);
    chosen.push(tier.slug);
    reasons.push({ id: `tier:${tier.slug}` });
    if (tier.bump) pushUnique(reasons, { id: tier.bump });
  }

  const picked: ExtraSlug[] = [];
  const included: ExtraSlug[] = [];
  for (const rule of extraRules) {
    if (!rule.when(answers)) continue;
    const extra = extraOf(rule.add);
    if (!extraAppliesTo(extra, chosen)) continue;
    if (extraIncludedIn(extra, chosen)) {
      if (!included.includes(extra.slug)) {
        included.push(extra.slug);
        reasons.push({ id: "included", extra: extra.slug });
      }
      continue;
    }
    if (!picked.includes(extra.slug)) {
      picked.push(extra.slug);
      reasons.push({ id: `extra:${extra.slug}`, extra: extra.slug });
    }
  }

  if (answers.management === "rare") reasons.push({ id: "management_rare" });

  if (kind === "both") {
    picked.push("maintenance");
    reasons.push({ id: "maintenance_both", extra: "maintenance" });
  }

  const order = extras.map((extra) => extra.slug);
  const sorted = [...picked].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const available = extras
    .filter((extra) => extraAppliesTo(extra, chosen) && !extraIncludedIn(extra, chosen))
    .map((extra) => extra.slug);

  return {
    route: "project",
    offers: chosen,
    extras: sorted,
    available,
    included,
    assumed: { kind: assumedKind, size: assumedSize },
    reasons,
  };
}

export function selectedExtras(
  recommendation: ProjectRecommendation,
  requested?: readonly ExtraSlug[],
): ExtraSlug[] {
  if (requested === undefined) return recommendation.extras;
  return recommendation.available.filter((slug) => requested.includes(slug));
}
