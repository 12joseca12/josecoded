import { describe, expect, it } from "vitest";

import { type QuestionId, recommend } from "./recommender";
import {
  advance,
  applyForm,
  completeAnswers,
  currentStep,
  encodeState,
  hasFormAction,
  parseState,
  type RecommenderState,
  retreat,
  reviewAnswers,
  toSearch,
  withExtras,
} from "./recommender-url";

const full = "idea.both.medium.basic.me.payments_seo";

describe("codec", () => {
  it("round-trips a complete state, with and without edited extras", () => {
    expect(encodeState(parseState(full))).toBe(full);
    expect(encodeState(parseState(`${full}.admin_push`))).toBe(`${full}.admin_push`);
    expect(encodeState(parseState(`${full}.-`))).toBe(`${full}.-`);
    expect(encodeState(parseState("defined.app.small.none.rare.-"))).toBe(
      "defined.app.small.none.rare.-",
    );
  });

  it("canonicalises the order of multiple answers", () => {
    expect(encodeState(parseState("idea.both.medium.basic.me.seo_payments"))).toBe(full);
  });

  it("parses partial states and stops at the first unknown segment", () => {
    expect(parseState("idea").draft).toEqual({ start: "idea" });
    expect(parseState("idea.web").draft).toEqual({ start: "idea", kind: "web" });
    expect(parseState("idea.nope.medium").draft).toEqual({ start: "idea" });
    expect(parseState("idea.web.medium.basic.me.payments_zzz").draft).toEqual({
      start: "idea",
      kind: "web",
      size: "medium",
      accounts: "basic",
      management: "me",
    });
    expect(parseState("").draft).toEqual({});
    expect(parseState(undefined).draft).toEqual({});
    expect(parseState("x".repeat(500)).draft).toEqual({});
  });

  it("ends at the first answer when the product already exists", () => {
    expect(parseState("existing.web.medium").draft).toEqual({ start: "existing" });
    expect(encodeState(parseState("existing"))).toBe("existing");
    expect(currentStep(parseState("existing"))).toBe("result");
  });

  it("ignores extras that are not slugs and extras before the answers are complete", () => {
    expect(parseState(`${full}.admin_nope`).extras).toBeUndefined();
    expect(parseState("idea.web.medium.basic.me.-").extras).toBeUndefined();
    expect(parseState("idea.web.medium.basic.me.-.admin").extras).toEqual(["admin"]);
    expect(parseState("idea.web.medium.basic.me.-.-").extras).toEqual([]);
  });

  it("builds a search string with the step only when editing", () => {
    expect(toSearch(parseState(full))).toBe(`q=${full}`);
    expect(toSearch({ ...parseState(full), paso: 2 })).toBe(`q=${full}&paso=2`);
    expect(toSearch({ draft: {} })).toBe("");
  });

  it("only honours a step the visitor can reach", () => {
    expect(parseState("idea.web", "3").paso).toBe(3);
    expect(parseState("idea.web", "4").paso).toBeUndefined();
    expect(parseState("idea.web", "0").paso).toBeUndefined();
    expect(parseState("idea.web", "abc").paso).toBeUndefined();
    expect(parseState("existing", "2").paso).toBeUndefined();
    expect(parseState("existing", "1").paso).toBe(1);
  });
});

describe("steps", () => {
  it("shows the first unanswered question, then the result", () => {
    expect(currentStep(parseState(undefined))).toBe("start");
    expect(currentStep(parseState("idea"))).toBe("kind");
    expect(currentStep(parseState("idea.web.medium.basic"))).toBe("management");
    expect(currentStep(parseState(full))).toBe("result");
    expect(currentStep(parseState(full, "3"))).toBe("size");
  });

  it("produces complete answers only when everything is answered", () => {
    expect(completeAnswers(parseState("idea.web").draft)).toBeNull();
    expect(completeAnswers(parseState("existing").draft)).toEqual({ start: "existing" });
    const answers = completeAnswers(parseState(full).draft);
    expect(answers).toMatchObject({ start: "idea", kind: "both", more: ["payments", "seo"] });
    if (answers) expect(recommend(answers).route).toBe("project");
  });
});

describe("advance", () => {
  const start = parseState(undefined);

  it("accepts one valid option for a single question", () => {
    const { state, accepted } = advance(start, "start", ["idea"]);
    expect(accepted).toBe(true);
    expect(encodeState(state)).toBe("idea");
  });

  it("refuses a missing, repeated or unknown option and a question out of turn", () => {
    expect(advance(start, "start", []).accepted).toBe(false);
    expect(advance(start, "start", ["idea", "defined"]).accepted).toBe(false);
    expect(advance(start, "start", ["nope"]).accepted).toBe(false);
    expect(advance(start, "kind", ["web"]).accepted).toBe(false);
  });

  it("lets the optional last question be empty and drops options that do not fit", () => {
    const before = parseState("idea.web.medium.none.rare");
    const { state } = advance(before, "more", ["seo", "push", "payments"]);
    expect(state.draft.more).toEqual(["payments", "seo"]);
    expect(encodeState(advance(before, "more", []).state)).toBe("idea.web.medium.none.rare.-");
  });

  it("finishes at once when the product already exists", () => {
    const { state } = advance(start, "start", ["existing"]);
    expect(currentStep(state)).toBe("result");
  });

  it("walks forward through the remaining steps while reviewing and then lands on the result", () => {
    let state: RecommenderState = reviewAnswers(parseState(full));
    expect(currentStep(state)).toBe("start");
    const seen: string[] = [];
    while (currentStep(state) !== "result") {
      const step = currentStep(state);
      seen.push(step);
      if (step === "start") state = advance(state, step, ["idea"]).state;
      else if (step === "more") state = advance(state, step, ["payments", "seo"]).state;
      else {
        const values: Record<string, string> = {
          kind: "both",
          size: "medium",
          accounts: "basic",
          management: "me",
        };
        state = advance(state, step as QuestionId, [values[step] ?? ""]).state;
      }
    }
    expect(seen).toEqual(["start", "kind", "size", "accounts", "management", "more"]);
    expect(encodeState(state)).toBe(full);
  });

  it("drops the edited extras whenever an answer changes", () => {
    const edited = parseState(`${full}.admin`);
    const { state } = advance({ ...edited, paso: 2 }, "kind", ["web"]);
    expect(state.extras).toBeUndefined();
  });
});

describe("retreat and review", () => {
  it("goes back one question keeping every answer", () => {
    const back = retreat(parseState("idea.web.medium"));
    expect(back.paso).toBe(3);
    expect(currentStep(back)).toBe("size");
    expect(back.draft.size).toBe("medium");
  });

  it("goes from the result to the last question, or the first for an existing product", () => {
    expect(currentStep(retreat(parseState(full)))).toBe("more");
    expect(currentStep(retreat(parseState("existing")))).toBe("start");
  });

  it("does not go back from the first question", () => {
    const first = parseState(undefined);
    expect(retreat(first)).toBe(first);
  });

  it("reviews from the first question with the answers kept", () => {
    const state = reviewAnswers(parseState(full));
    expect(state.paso).toBe(1);
    expect(state.draft.kind).toBe("both");
  });
});

describe("withExtras", () => {
  it("keeps the answers and valid extra slugs only", () => {
    const state = withExtras(parseState(full), ["push", "nope", "admin"]);
    expect(state.extras).toEqual(["push", "admin"]);
    expect(encodeState(state)).toBe(`${full}.push_admin`);
  });
});

describe("form without JavaScript", () => {
  it("applies the answer of the current step and returns the new state", () => {
    const state = applyForm({ q: "idea", s: "kind", a: "web" });
    expect(encodeState(state)).toBe("idea.web");
  });

  it("reads several values for the multiple question and an empty one", () => {
    const params = { q: "idea.web.medium.none.rare", s: "more" };
    expect(encodeState(applyForm({ ...params, a: ["seo", "payments"] }))).toBe(
      "idea.web.medium.none.rare.payments_seo",
    );
    expect(encodeState(applyForm(params))).toBe("idea.web.medium.none.rare.-");
  });

  it("ignores a step that is not the current one or an unknown step", () => {
    expect(encodeState(applyForm({ q: "idea", s: "size", a: "small" }))).toBe("idea");
    expect(encodeState(applyForm({ q: "idea", s: "nope", a: "small" }))).toBe("idea");
  });

  it("applies the extras form", () => {
    const state = applyForm({ q: full, x: "1", e: ["admin", "push"] });
    expect(state.extras).toEqual(["admin", "push"]);
    expect(applyForm({ q: full, x: "1" }).extras).toEqual([]);
  });

  it("detects whether the request carries a form action", () => {
    expect(hasFormAction({ q: "idea" })).toBe(false);
    expect(hasFormAction({ q: "idea", s: "kind" })).toBe(true);
    expect(hasFormAction({ q: full, x: "1" })).toBe(true);
  });
});
