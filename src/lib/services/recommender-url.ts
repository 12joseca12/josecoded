import { type ExtraSlug, isExtraSlug } from "./offers";
import {
  type Answers,
  type Draft,
  moreValues,
  optionsFor,
  type ProjectAnswers,
  type QuestionId,
  questionIds,
  questions,
} from "./recommender";

export interface RecommenderState {
  draft: Draft;
  extras?: ExtraSlug[];
  paso?: number;
}

export type Step = QuestionId | "result";

export const totalSteps = questionIds.length;

const maxQueryLength = 200;
const segmentSeparator = ".";
const listSeparator = "_";
const emptyList = "-";

type Params = Record<string, string | string[] | undefined>;

function firstOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function listOf(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseMore(segment: string): Draft["more"] {
  if (segment === emptyList) return [];
  const parts = segment.split(listSeparator);
  const valid = moreValues.filter((value) => parts.includes(value));
  return valid.length === parts.length ? valid : undefined;
}

function parseExtras(segment: string): ExtraSlug[] | undefined {
  if (segment === emptyList) return [];
  const parts = segment.split(listSeparator);
  return parts.every(isExtraSlug) ? parts.filter(isExtraSlug) : undefined;
}

function pick<T extends string>(options: readonly T[], value: string | undefined): T | undefined {
  return options.find((option) => option === value);
}

function draftFromSegments(segments: string[]): Draft {
  const draft: Draft = {};
  const start = pick(["idea", "defined", "existing"], segments[0]);
  if (!start) return draft;
  draft.start = start;
  if (start === "existing") return draft;
  const kind = pick(["web", "app", "both", "unsure"], segments[1]);
  if (!kind) return draft;
  draft.kind = kind;
  const size = pick(["small", "medium", "large", "unsure"], segments[2]);
  if (!size) return draft;
  draft.size = size;
  const accounts = pick(["none", "basic", "roles"], segments[3]);
  if (!accounts) return draft;
  draft.accounts = accounts;
  const management = pick(["me", "rare", "team"], segments[4]);
  if (!management) return draft;
  draft.management = management;
  const more = segments[5] === undefined ? undefined : parseMore(segments[5]);
  if (more) draft.more = more;
  return draft;
}

export function isFinished(draft: Draft): boolean {
  if (draft.start === "existing") return true;
  return questionIds.every((id) => draft[id] !== undefined);
}

function answeredCount(draft: Draft): number {
  if (draft.start === "existing") return 1;
  const index = questionIds.findIndex((id) => draft[id] === undefined);
  return index === -1 ? questionIds.length : index;
}

export function parseState(
  q: string | string[] | undefined,
  paso?: string | string[],
): RecommenderState {
  const raw = firstOf(q);
  if (raw === undefined || raw.length === 0 || raw.length > maxQueryLength) return { draft: {} };
  const segments = raw.split(segmentSeparator);
  const draft = draftFromSegments(segments);
  const state: RecommenderState = { draft };
  if (draft.start !== "existing" && isFinished(draft) && segments[6] !== undefined) {
    const parsed = parseExtras(segments[6]);
    if (parsed) state.extras = parsed;
  }
  const step = Number(firstOf(paso));
  const limit = draft.start === "existing" ? 1 : totalSteps;
  if (Number.isInteger(step) && step >= 1 && step <= Math.min(limit, answeredCount(draft) + 1)) {
    state.paso = step;
  }
  return state;
}

export function encodeState(state: RecommenderState): string {
  const { draft } = state;
  if (!draft.start) return "";
  if (draft.start === "existing") return "existing";
  const segments: string[] = [draft.start];
  const rest: (string | undefined)[] = [
    draft.kind,
    draft.size,
    draft.accounts,
    draft.management,
    draft.more === undefined ? undefined : draft.more.join(listSeparator) || emptyList,
  ];
  for (const segment of rest) {
    if (segment === undefined) return segments.join(segmentSeparator);
    segments.push(segment);
  }
  if (state.extras) segments.push(state.extras.join(listSeparator) || emptyList);
  return segments.join(segmentSeparator);
}

export function toSearch(state: RecommenderState): string {
  const params = new URLSearchParams();
  const q = encodeState(state);
  if (q) params.set("q", q);
  if (state.paso !== undefined && q) params.set("paso", String(state.paso));
  return params.toString();
}

export function currentStep(state: RecommenderState): Step {
  const { draft } = state;
  if (state.paso !== undefined) {
    const id = questionIds[state.paso - 1];
    if (id && (draft.start !== "existing" || id === "start")) return id;
  }
  if (draft.start === "existing") return "result";
  return questionIds.find((id) => draft[id] === undefined) ?? "result";
}

export function stepNumber(step: Step): number {
  return step === "result" ? totalSteps : questionIds.indexOf(step) + 1;
}

export function completeAnswers(draft: Draft): Answers | null {
  if (draft.start === "existing") return { start: "existing" };
  if (!isFinished(draft)) return null;
  const { start, kind, size, accounts, management, more } = draft;
  if (!start || !kind || !size || !accounts || !management || !more) {
    return null;
  }
  const answers: ProjectAnswers = { start, kind, size, accounts, management, more };
  return answers;
}

export interface Advance {
  state: RecommenderState;
  accepted: boolean;
}

export function advance(state: RecommenderState, step: QuestionId, values: string[]): Advance {
  if (currentStep(state) !== step) return { state, accepted: false };
  const question = questions.find((entry) => entry.id === step);
  if (!question) return { state, accepted: false };
  const allowed = optionsFor(step, state.draft);
  const chosen = values.filter((value) => allowed.includes(value));
  if (!question.multiple && chosen.length !== 1) return { state, accepted: false };

  const draft: Draft = { ...state.draft };
  if (step === "more") {
    draft.more = moreValues.filter((value) => chosen.includes(value));
  } else {
    const value = chosen[0];
    if (value === undefined) return { state, accepted: false };
    Object.assign(draft, { [step]: value });
  }

  const next: RecommenderState = { draft };
  const position = questionIds.indexOf(step) + 1;
  const editing = state.paso !== undefined;
  const nextId = questionIds[position];
  if (editing && nextId && (draft.start !== "existing" || step !== "start")) {
    next.paso = position + 1;
  }
  return { state: next, accepted: true };
}

export function retreat(state: RecommenderState): RecommenderState {
  const step = currentStep(state);
  const target =
    step === "result" ? (state.draft.start === "existing" ? 1 : totalSteps) : stepNumber(step) - 1;
  return target < 1 ? state : { draft: state.draft, paso: target };
}

export function reviewAnswers(state: RecommenderState): RecommenderState {
  return { draft: state.draft, paso: 1 };
}

export function withExtras(state: RecommenderState, requested: string[]): RecommenderState {
  return { draft: state.draft, extras: requested.filter(isExtraSlug) };
}

export function hasFormAction(params: Params): boolean {
  return params.s !== undefined || params.x !== undefined;
}

export function applyForm(params: Params): RecommenderState {
  const state = parseState(params.q, params.paso);
  const step = firstOf(params.s);
  if (step !== undefined) {
    const id = questionIds.find((entry) => entry === step);
    if (id) return advance(state, id, listOf(params.a)).state;
    return state;
  }
  if (params.x !== undefined) return withExtras(state, listOf(params.e));
  return state;
}
