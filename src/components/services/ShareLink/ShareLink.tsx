"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button/Button";

import styles from "./ShareLink.module.css";

interface ShareLinkLabels {
  copy: string;
  copied: string;
  failed: string;
  link: string;
}

interface ShareLinkProps {
  href: string;
  labels: ShareLinkLabels;
}

type CopyStatus = "idle" | "copied" | "failed";

const noopSubscribe = () => () => undefined;
const currentOrigin = () => window.location.origin;
const serverOrigin = () => "";
const statusClearMs = 4000;

export function ShareLink({ href, labels }: ShareLinkProps) {
  const origin = useSyncExternalStore(noopSubscribe, currentOrigin, serverOrigin);
  const [status, setStatus] = useState<CopyStatus>("idle");
  const field = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const enhanced = origin !== "";
  const url = `${origin}${href}`;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const report = (next: CopyStatus) => {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    if (next === "copied") {
      timer.current = setTimeout(() => {
        setStatus("idle");
      }, statusClearMs);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      report("copied");
    } catch {
      report("failed");
      field.current?.focus();
      field.current?.select();
    }
  };

  const showField = !enhanced || status === "failed";

  return (
    <div className={styles.share} data-testid="share-link">
      {enhanced ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            void copy();
          }}
        >
          {labels.copy}
        </Button>
      ) : null}
      {showField ? (
        <div className={styles.field}>
          <label htmlFor={`${id}-url`} className={styles.label}>
            {labels.link}
          </label>
          <input
            ref={field}
            id={`${id}-url`}
            className={styles.input}
            type="text"
            readOnly
            value={url}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
        </div>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite" data-status={status}>
        {status === "copied" ? labels.copied : status === "failed" ? labels.failed : ""}
      </p>
    </div>
  );
}
