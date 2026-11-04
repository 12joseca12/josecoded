"use client";

import {
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/Button/Button";
import { FieldError } from "@/components/ui/Field/FieldError";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { loadTurnstile } from "@/lib/contact/turnstile-client";

import styles from "./TurnstileField.module.css";

export interface TurnstileHandle {
  reset: () => void;
  focus: () => void;
}

interface TurnstileFieldProps {
  siteKey: string;
  scriptUrl: string;
  locale: string;
  label: string;
  loadingLabel: string;
  loadFailedLabel: string;
  retryLabel: string;
  error?: string;
  onToken: (token: string | null) => void;
  ref?: Ref<TurnstileHandle>;
}

type LoadState = "idle" | "loading" | "ready" | "failed";

const lazyMargin = "300px";

export function TurnstileField({
  siteKey,
  scriptUrl,
  locale,
  label,
  loadingLabel,
  loadFailedLabel,
  retryLabel,
  error,
  onToken,
  ref,
}: TurnstileFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const frame = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [state, setState] = useState<LoadState>("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onTokenRef.current(null);
      if (widget.current !== null) window.turnstile?.reset(widget.current);
    },
    focus: () => {
      frame.current?.focus();
    },
  }));

  const start = useCallback(() => {
    setState("loading");
    loadTurnstile(scriptUrl).then(
      (api) => {
        if (!mount.current || widget.current !== null) return;
        widget.current = api.render(mount.current, {
          sitekey: siteKey,
          language: locale,
          theme: "light",
          size: "flexible",
          callback: (token) => {
            onTokenRef.current(token);
          },
          "error-callback": () => {
            onTokenRef.current(null);
          },
          "expired-callback": () => {
            onTokenRef.current(null);
          },
        });
        setState("ready");
      },
      () => {
        setState("failed");
      },
    );
  }, [scriptUrl, siteKey, locale]);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(start, 0);
      return () => {
        window.clearTimeout(timer);
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: lazyMargin },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [start, attempt]);

  useEffect(
    () => () => {
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    },
    [],
  );

  return (
    <div className={styles.field} data-state={state} data-invalid={error ? "true" : undefined}>
      <div
        ref={frame}
        className={styles.frame}
        role="group"
        tabIndex={-1}
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
      >
        <div ref={mount} className={styles.mount} />
        {state !== "ready" && state !== "failed" ? (
          <div className={styles.placeholder} role="status">
            <Skeleton height="4rem" />
            <span className={styles.loading}>{loadingLabel}</span>
          </div>
        ) : null}
      </div>
      {state === "failed" ? (
        <div className={styles.failed} role="alert">
          <p>{loadFailedLabel}</p>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              setState("idle");
              setAttempt((count) => count + 1);
            }}
          >
            {retryLabel}
          </Button>
        </div>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
