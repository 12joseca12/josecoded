"use client";

import { type SyntheticEvent, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { useOpenChat } from "@/lib/chat/use-open-chat";
import type { NexoGuide } from "@/lib/nexo/guide";
import { nexoStateFor } from "@/lib/nexo/state";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import type { NexoChatLabels, NexoState } from "@/types/nexo";

import { NexoAvatar } from "./NexoAvatar";
import styles from "./NexoFaqChat.module.css";

interface NexoChatCardProps {
  guide: NexoGuide;
  labels: NexoChatLabels;
  locale: string;
  formHref: string;
}

interface Turn {
  id: number;
  from: "user" | "nexo";
  text: string;
  handoff: boolean;
}

type Phase = "ready" | "thinking" | "talking";

const thinkMs = 700;
const thinkReducedMs = 250;
const greetingMs = 2400;
const maxSuggestions = 4;
const maxLength = 200;

function talkMs(text: string): number {
  return Math.min(3200, Math.max(1200, 900 + text.length * 14));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function NexoChatCard({ guide, labels, locale, formHref }: NexoChatCardProps) {
  const titleId = useId();
  const inputId = useId();
  const openChat = useOpenChat(locale);
  const reducedMotion = usePrefersReducedMotion();
  const [turns, setTurns] = useState<Turn[]>([
    { id: 0, from: "nexo", text: labels.greeting, handoff: false },
  ]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [greeting, setGreeting] = useState(true);
  const log = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const mounted = useRef(false);
  const talking = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      setGreeting(false);
    }, greetingMs);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
      if (talking.current) clearTimeout(talking.current);
    };
  }, []);

  useEffect(() => {
    const node = log.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" });
  }, [turns, phase, reducedMotion]);

  const busy = phase === "thinking";
  const listening = focused && draft.trim().length > 0;
  let state: NexoState = nexoStateFor("reply-finished");
  if (phase === "thinking") state = nexoStateFor("awaiting-reply");
  else if (phase === "talking") state = nexoStateFor("streaming");
  else if (listening) state = nexoStateFor("typing");
  else if (greeting) state = nexoStateFor("visitor-arrived");

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    if (talking.current) clearTimeout(talking.current);
    const userTurn: Turn = { id: nextId.current++, from: "user", text: question, handoff: false };
    setTurns((current) => [...current, userTurn]);
    setDraft("");
    setPhase("thinking");
    const reply = guide.reply(question).catch(() => ({ kind: "handoff" as const }));
    void Promise.all([reply, wait(reducedMotion ? thinkReducedMs : thinkMs)]).then(([result]) => {
      if (!mounted.current) return;
      const text = result.kind === "answer" ? result.text : labels.fallback;
      const nexoTurn: Turn = {
        id: nextId.current++,
        from: "nexo",
        text,
        handoff: result.kind === "handoff",
      };
      setTurns((current) => [...current, nexoTurn]);
      setPhase("talking");
      talking.current = setTimeout(() => {
        setPhase("ready");
      }, talkMs(text));
    });
  };

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    ask(draft);
  };

  return (
    <section className={styles.card} aria-labelledby={titleId} data-testid="nexo-chat">
      <header className={styles.head}>
        <NexoAvatar state={state} label={labels.states[state]} />
        <div className={styles.intro}>
          <h3 id={titleId} className={styles.title}>
            {labels.title}
          </h3>
          <p className={styles.subtitle}>{labels.subtitle}</p>
        </div>
      </header>
      <div
        ref={log}
        className={styles.log}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={labels.logLabel}
        tabIndex={0}
      >
        <ul className={styles.turns}>
          {turns.map((turn) => (
            <li key={turn.id} className={styles.turn} data-from={turn.from}>
              <VisuallyHidden>{turn.from === "user" ? labels.you : labels.nexo}</VisuallyHidden>
              <p className={styles.bubble}>{turn.text}</p>
              {turn.handoff ? (
                <div className={styles.handoff}>
                  <Button href={formHref} size="sm" icon={<ArrowIcon />}>
                    {labels.form}
                  </Button>
                  <Button size="sm" variant="light" onClick={openChat}>
                    {labels.chat}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
          {busy ? (
            <li className={styles.turn} data-from="nexo" data-typing="">
              <VisuallyHidden>{labels.typing}</VisuallyHidden>
              <span className={styles.bubble} aria-hidden="true">
                <span className={styles.dots}>
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </li>
          ) : null}
        </ul>
      </div>
      <div className={styles.chips} role="group" aria-label={labels.suggestionsLabel}>
        {guide.suggestions.slice(0, maxSuggestions).map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={styles.chip}
            aria-disabled={busy || undefined}
            onClick={() => {
              ask(suggestion.text);
            }}
          >
            {suggestion.text}
          </button>
        ))}
      </div>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={inputId} className={styles.label}>
          <VisuallyHidden>{labels.inputLabel}</VisuallyHidden>
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          value={draft}
          placeholder={labels.placeholder}
          maxLength={maxLength}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
        />
        <Button
          type="submit"
          size="sm"
          loading={busy}
          loadingLabel={labels.sending}
          icon={<ArrowIcon />}
        >
          {labels.send}
        </Button>
      </form>
    </section>
  );
}
