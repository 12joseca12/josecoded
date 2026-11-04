import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createScriptedGuide,
  type GuideMoment,
  type GuideScript,
  type NexoGuide,
} from "@/lib/nexo/guide";
import { nexoStateFor } from "@/lib/nexo/state";
import type { QuestionId } from "@/lib/services/recommender";
import type { NexoState } from "@/types/nexo";

const speakMs = 2400;
const listenMs = 2000;
const cheerMs = 3200;

export interface GuideView {
  text: string;
  state: NexoState;
}

export function initialView(script: GuideScript, step: QuestionId | "result"): GuideView {
  if (step === "result") return { text: script["result.project"] ?? "", state: "idle" };
  const ask = script[`ask.${step}`] ?? "";
  if (step === "start") {
    return { text: [script.greeting, ask].filter(Boolean).join(" "), state: "greeting" };
  }
  return { text: ask, state: "talking" };
}

export function useGuide(script: GuideScript, first: QuestionId | "result", provider?: NexoGuide) {
  const guide = useMemo(() => provider ?? createScriptedGuide(script), [provider, script]);
  const [view, setView] = useState<GuideView>(() => initialView(script, first));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef(0);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const later = useCallback((ms: number, next: NexoState) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setView((current) => ({ ...current, state: next }));
    }, ms);
  }, []);

  const say = useCallback(
    (moment: GuideMoment) => {
      token.current += 1;
      const mine = token.current;
      void Promise.resolve(guide.respond(moment)).then((line) => {
        if (mine !== token.current) return;
        const state = nexoStateFor(line.event);
        setView((current) => ({ text: line.text ?? current.text, state }));
        if (state === "greeting") later(speakMs, "talking");
        else if (state === "talking") later(speakMs, "idle");
        else if (state === "listening") later(listenMs, "idle");
        else if (state === "happy") later(cheerMs, "idle");
        else if (state === "thinking") clear();
      });
    },
    [guide, later],
  );

  const firstStep = useRef(first);
  useEffect(() => {
    later(speakMs, firstStep.current === "start" ? "talking" : "idle");
    return clear;
  }, [later]);

  return { view, say };
}
