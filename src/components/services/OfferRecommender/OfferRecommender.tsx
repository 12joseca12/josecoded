"use client";

import { type MouseEvent, type SyntheticEvent, useEffect, useRef, useState } from "react";

import { NexoGuideBubble } from "@/components/services/NexoGuideBubble/NexoGuideBubble";
import { Button } from "@/components/ui/Button/Button";
import { ProgressRing } from "@/components/ui/ProgressRing/ProgressRing";
import type { GuideScript, RecommenderGuide } from "@/lib/nexo/guide";
import type { ExtraSlug } from "@/lib/services/offers";
import { optionsFor, type QuestionId, questions, recommend } from "@/lib/services/recommender";
import {
  advance,
  completeAnswers,
  currentStep,
  encodeState,
  parseState,
  type RecommenderState,
  retreat,
  reviewAnswers,
  stepNumber,
  toSearch,
  totalSteps,
  withExtras,
} from "@/lib/services/recommender-url";
import { recommenderUrlEvent } from "@/lib/services/recommender-url-event";

import type { RecommenderCopy } from "./copy";
import styles from "./OfferRecommender.module.css";
import { OfferResult } from "./OfferResult";
import { useGuide } from "./useGuide";

export interface GuideLabels {
  avatar: string;
  name: string;
  role: string;
  disclosure: string;
}

interface OfferRecommenderProps {
  locale: string;
  basePath: string;
  origin: string;
  initial: { q?: string; paso?: string };
  copy: RecommenderCopy;
  guideScript: GuideScript;
  guideLabels: GuideLabels;
  guide?: RecommenderGuide;
}

const computeMs = 600;
const previewIds = ["start", "kind", "size", "accounts", "management"] as const;

export function OfferRecommender({
  locale,
  basePath,
  origin,
  initial,
  copy,
  guideScript,
  guideLabels,
  guide,
}: OfferRecommenderProps) {
  const [state, setState] = useState<RecommenderState>(() => parseState(initial.q, initial.paso));
  const [error, setError] = useState(false);
  const [computing, setComputing] = useState(false);
  const focusNext = useRef<"legend" | "result" | null>(null);
  const legend = useRef<HTMLLegendElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = currentStep(state);
  const { view, say } = useGuide(guideScript, step, guide);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      focusNext.current = null;
      setError(false);
      setState(parseState(params.get("q") ?? undefined, params.get("paso") ?? undefined));
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (focusNext.current === "legend") legend.current?.focus();
    else if (focusNext.current === "result") result.current?.focus();
    focusNext.current = null;
  });

  const hrefFor = (target: RecommenderState) => {
    const search = toSearch(target);
    return `${basePath}${search ? `?${search}` : ""}#recomendador`;
  };

  const writeUrl = (target: RecommenderState, replace: boolean) => {
    const search = toSearch(target);
    const url = `${window.location.pathname}${search ? `?${search}` : ""}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(recommenderUrlEvent));
  };

  const show = (target: RecommenderState, replace = false) => {
    setError(false);
    setState(target);
    writeUrl(target, replace);
    const next = currentStep(target);
    focusNext.current = next === "result" ? "result" : "legend";
    if (next === "result") {
      const answers = completeAnswers(target.draft);
      const outcome = answers ? recommend(answers) : null;
      say({
        kind: "result",
        route: outcome?.route ?? "project",
        assumed: outcome?.route === "project" && (outcome.assumed.kind || outcome.assumed.size),
      });
    } else {
      say({ kind: "ask", step: next });
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (computing || step === "result") return;
    const data = new FormData(event.currentTarget);
    const values = data.getAll("a").filter((value) => typeof value === "string");
    const outcome = advance(state, step, values);
    if (!outcome.accepted) {
      setError(true);
      event.currentTarget.querySelector<HTMLInputElement>("input[name='a']")?.focus();
      return;
    }
    const next = currentStep(outcome.state);
    if (next === "result") {
      setComputing(true);
      say({ kind: "compute" });
      timer.current = setTimeout(() => {
        setComputing(false);
        show(outcome.state);
      }, computeMs);
      return;
    }
    show(outcome.state);
  };

  const navigate = (event: MouseEvent<HTMLElement>, target: RecommenderState) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    show(target);
  };

  const onOption = (value: string) => {
    say({ kind: "option", step: step === "result" ? "start" : step, value });
  };

  const updateExtras = (selected: ExtraSlug[]) => {
    const next = withExtras(state, selected);
    setState(next);
    writeUrl(next, true);
  };

  const number = stepNumber(step);
  const ringLabel =
    step === "result"
      ? copy.progressDone
      : copy.progress.replace("{current}", String(number)).replace("{total}", String(totalSteps));
  const bubbleId = "recommender-guide";
  const question = questions.find((entry) => entry.id === step);
  const current = step === "result" || !question ? null : question;
  const previewAnswers =
    step === "more"
      ? previewIds
          .map((id) => {
            const value = state.draft[id];
            return typeof value === "string" ? copy.questions[id].options[value]?.label : undefined;
          })
          .filter((label): label is string => label !== undefined)
          .join(" · ")
      : "";

  return (
    <div className={styles.shell} data-step={step}>
      <NexoGuideBubble id={bubbleId} state={view.state} text={view.text} labels={guideLabels} />
      <div className={styles.panel}>
        <div className={styles.progress}>
          <ProgressRing value={number} max={totalSteps} label={ringLabel} size="lg" />
          <p className={styles.step} aria-live="polite">
            {ringLabel}
          </p>
        </div>
        {step === "result" ? (
          <OfferResult
            ref={result}
            locale={locale}
            copy={copy}
            state={state}
            reviewHref={hrefFor(reviewAnswers(state))}
            basePath={basePath}
            origin={origin}
            onReview={(event) => {
              navigate(event, reviewAnswers(state));
            }}
            onExtras={updateExtras}
          />
        ) : current ? (
          <form
            key={`${step}-${state.paso ?? 0}`}
            method="get"
            action={basePath}
            className={styles.form}
            aria-label={copy.label}
            noValidate
            onSubmit={onSubmit}
          >
            <input type="hidden" name="q" value={encodeState({ draft: state.draft })} />
            {state.paso !== undefined ? (
              <input type="hidden" name="paso" value={state.paso} />
            ) : null}
            <input type="hidden" name="s" value={step} />
            <fieldset
              className={styles.group}
              aria-describedby={error ? `${bubbleId} recommender-error` : bubbleId}
            >
              <legend ref={legend} tabIndex={-1} className={styles.legend}>
                {copy.questions[step].legend}
              </legend>
              {current.multiple ? <p className={styles.hint}>{copy.multipleHint}</p> : null}
              <div className={styles.options}>
                {optionsFor(step, state.draft).map((value) => {
                  const id = `recommender-${step}-${value}`;
                  const text = copy.questions[step].options[value];
                  const chosen = chosenValues(state, step);
                  return (
                    <div
                      key={value}
                      className={styles.option}
                      onMouseEnter={() => {
                        onOption(value);
                      }}
                    >
                      <input
                        id={id}
                        className={styles.input}
                        type={current.multiple ? "checkbox" : "radio"}
                        name="a"
                        value={value}
                        defaultChecked={chosen.includes(value)}
                        required={!current.multiple}
                        aria-describedby={`${id}-hint`}
                        onFocus={() => {
                          onOption(value);
                        }}
                        onChange={() => {
                          setError(false);
                          onOption(value);
                        }}
                      />
                      <label htmlFor={id} className={styles.card}>
                        <span className={styles.label}>{text?.label}</span>
                        <span id={`${id}-hint`} className={styles.cardHint}>
                          {text?.hint}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              {error ? (
                <p id="recommender-error" className={styles.error} role="alert">
                  {copy.required}
                </p>
              ) : null}
            </fieldset>
            {previewAnswers ? (
              <p className={styles.preview} data-testid="recommender-preview">
                {copy.preview.replace("{answers}", previewAnswers)}
              </p>
            ) : null}
            <div className={styles.actions}>
              {number > 1 ? (
                <Button
                  variant="quiet"
                  href={hrefFor(retreat(state))}
                  onClick={(event: MouseEvent<HTMLElement>) => {
                    navigate(event, retreat(state));
                  }}
                >
                  {copy.back}
                </Button>
              ) : null}
              <Button type="submit" loading={computing} loadingLabel={copy.see}>
                {step === "more" || (state.paso === undefined && number === totalSteps)
                  ? copy.see
                  : copy.next}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function chosenValues(state: RecommenderState, step: QuestionId): readonly string[] {
  const value = state.draft[step];
  if (value === undefined) return [];
  return Array.isArray(value) ? (value as string[]) : [String(value)];
}
