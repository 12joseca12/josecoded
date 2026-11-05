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
  origin: string;
  href: string;
  labels: ShareLinkLabels;
}

type CopyStatus = "idle" | "copied" | "failed";

const noopSubscribe = () => () => undefined;
const hydrated = () => true;
const notHydrated = () => false;
const statusClearMs = 4000;
const announceGapMs = 60;

export function ShareLink({ origin, href, labels }: ShareLinkProps) {
  const enhanced = useSyncExternalStore(noopSubscribe, hydrated, notHydrated);
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [message, setMessage] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const url = `${origin}${href}`;

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (announceTimer.current) clearTimeout(announceTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (status !== "failed") return;
    field.current?.focus();
    field.current?.select();
  }, [status]);

  const report = (next: CopyStatus) => {
    setStatus(next);
    setMessage("");
    if (clearTimer.current) clearTimeout(clearTimer.current);
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => {
      setMessage(next === "copied" ? labels.copied : labels.failed);
    }, announceGapMs);
    if (next === "copied") {
      clearTimer.current = setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, statusClearMs);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      report("copied");
    } catch {
      report("failed");
    }
  };

  const showField = !enhanced || status === "failed";

  return (
    <div className={styles.share} data-testid="share-link">
      {enhanced ? (
        <div className={styles.action}>
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
        </div>
      ) : null}
      <div className={styles.field} data-visible={showField}>
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
      <p className={styles.status} role="status" aria-live="polite" data-status={status}>
        {message}
      </p>
    </div>
  );
}
